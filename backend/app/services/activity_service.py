"""
Service for managing learner daily active time tracking and daily learning goals.
"""
import calendar
from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.activity import LearnerDailyActivity
from app.models.learner import LearnerProfile
from app.schemas.activity import (
    ActivitySyncRequest,
    DailyActivityResponse,
    ActivitySummaryResponse,
    CategoryBreakdown,
    MonthCalendarResponse,
    StreakResponse,
)


class ActivityService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_user_preferred_goal(self, user_id: str) -> int:
        """Fetch current preferred daily_goal_minutes from LearnerProfile, defaulting to 20."""
        stmt = select(LearnerProfile.daily_goal_minutes).where(LearnerProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        goal = res.scalar_one_or_none()
        return goal if (goal is not None and goal > 0) else 20

    def _build_daily_response(self, record: LearnerDailyActivity, fallback_goal: int = 20) -> DailyActivityResponse:
        """Construct DailyActivityResponse including goal eligibility, completion status, and bonus time."""
        goal = record.goal_minutes if (record.goal_minutes is not None and record.goal_minutes > 0) else fallback_goal
        eligible_sec = record.assessment_seconds + record.lesson_seconds + record.game_seconds + record.ai_tutor_seconds
        goal_sec = goal * 60
        completed = eligible_sec >= goal_sec
        bonus_min = max(0, (eligible_sec - goal_sec) // 60) if completed else 0

        return DailyActivityResponse(
            activity_date=record.activity_date,
            total_active_seconds=record.total_active_seconds,
            assessment_seconds=record.assessment_seconds,
            lesson_seconds=record.lesson_seconds,
            game_seconds=record.game_seconds,
            ai_tutor_seconds=record.ai_tutor_seconds,
            general_seconds=record.general_seconds,
            goal_minutes=goal,
            goal_eligible_seconds=eligible_sec,
            goal_completed=completed,
            bonus_learning_minutes=bonus_min,
        )

    async def sync_active_time(
        self, user_id: str, data: ActivitySyncRequest
    ) -> LearnerDailyActivity:
        """
        Incrementally add accumulated active seconds for a learner on a specific date.
        Uses atomic update / upsert pattern to prevent double counting or duplicate rows.
        Snapshots preferred daily goal if row is newly created.
        """
        inc_assessment = max(0, min(data.assessment_seconds, 3600))
        inc_lesson = max(0, min(data.lesson_seconds, 3600))
        inc_game = max(0, min(data.game_seconds, 3600))
        inc_ai_tutor = max(0, min(data.ai_tutor_seconds, 3600))
        inc_general = max(0, min(data.general_seconds, 3600))

        stmt = select(LearnerDailyActivity).where(
            LearnerDailyActivity.user_id == user_id,
            LearnerDailyActivity.activity_date == data.activity_date,
        )
        result = await self.db.execute(stmt)
        record = result.scalar_one_or_none()

        preferred_goal = await self._get_user_preferred_goal(user_id)

        if record is None:
            total = inc_assessment + inc_lesson + inc_game + inc_ai_tutor + inc_general
            record = LearnerDailyActivity(
                user_id=user_id,
                activity_date=data.activity_date,
                assessment_seconds=inc_assessment,
                lesson_seconds=inc_lesson,
                game_seconds=inc_game,
                ai_tutor_seconds=inc_ai_tutor,
                general_seconds=inc_general,
                total_active_seconds=total,
                goal_minutes=preferred_goal,
            )
            self.db.add(record)
        else:
            record.assessment_seconds += inc_assessment
            record.lesson_seconds += inc_lesson
            record.game_seconds += inc_game
            record.ai_tutor_seconds += inc_ai_tutor
            record.general_seconds += inc_general
            record.total_active_seconds = (
                record.assessment_seconds
                + record.lesson_seconds
                + record.game_seconds
                + record.ai_tutor_seconds
                + record.general_seconds
            )
            if not record.goal_minutes or record.goal_minutes <= 0:
                record.goal_minutes = preferred_goal

        await self.db.commit()
        await self.db.refresh(record)
        return record

    async def update_daily_goal(
        self, user_id: str, new_goal_minutes: int, reference_date: date
    ) -> DailyActivityResponse:
        """
        Update the learner's preferred daily goal AND update today's activity snapshot goal immediately.
        Historical goal snapshots on previous dates remain unchanged.
        """
        # 1. Update preferred goal on LearnerProfile
        stmt_prof = select(LearnerProfile).where(LearnerProfile.user_id == user_id)
        res_prof = await self.db.execute(stmt_prof)
        profile = res_prof.scalar_one_or_none()
        if profile:
            profile.daily_goal_minutes = new_goal_minutes

        # 2. Update today's activity record snapshot
        stmt_act = select(LearnerDailyActivity).where(
            LearnerDailyActivity.user_id == user_id,
            LearnerDailyActivity.activity_date == reference_date,
        )
        res_act = await self.db.execute(stmt_act)
        record = res_act.scalar_one_or_none()

        if record is None:
            record = LearnerDailyActivity(
                user_id=user_id,
                activity_date=reference_date,
                assessment_seconds=0,
                lesson_seconds=0,
                game_seconds=0,
                ai_tutor_seconds=0,
                general_seconds=0,
                total_active_seconds=0,
                goal_minutes=new_goal_minutes,
            )
            self.db.add(record)
        else:
            record.goal_minutes = new_goal_minutes

        await self.db.commit()
        await self.db.refresh(record)
        return self._build_daily_response(record, new_goal_minutes)

    async def get_today_activity(
        self, user_id: str, reference_date: date
    ) -> DailyActivityResponse:
        """
        Retrieve the daily activity record for a specific date (defaults to today).
        """
        preferred_goal = await self._get_user_preferred_goal(user_id)
        stmt = select(LearnerDailyActivity).where(
            LearnerDailyActivity.user_id == user_id,
            LearnerDailyActivity.activity_date == reference_date,
        )
        result = await self.db.execute(stmt)
        record = result.scalar_one_or_none()

        if record is None:
            return DailyActivityResponse(
                activity_date=reference_date,
                total_active_seconds=0,
                assessment_seconds=0,
                lesson_seconds=0,
                game_seconds=0,
                ai_tutor_seconds=0,
                general_seconds=0,
                goal_minutes=preferred_goal,
                goal_eligible_seconds=0,
                goal_completed=False,
                bonus_learning_minutes=0,
            )

        return self._build_daily_response(record, preferred_goal)

    async def get_activity_summary(
        self, user_id: str, period: str, reference_date: date
    ) -> ActivitySummaryResponse:
        """
        Calculate aggregated activity metrics and daily goal statuses for a period ('today', 'week', 'month').
        """
        preferred_goal = await self._get_user_preferred_goal(user_id)

        if period == "today":
            start_date = reference_date
            end_date = reference_date
        elif period == "week":
            start_date = reference_date - timedelta(days=6)
            end_date = reference_date
        elif period == "month":
            start_date = reference_date - timedelta(days=29)
            end_date = reference_date
        else:
            period = "today"
            start_date = reference_date
            end_date = reference_date

        stmt = (
            select(LearnerDailyActivity)
            .where(
                LearnerDailyActivity.user_id == user_id,
                LearnerDailyActivity.activity_date >= start_date,
                LearnerDailyActivity.activity_date <= end_date,
            )
            .order_by(LearnerDailyActivity.activity_date.asc())
        )
        result = await self.db.execute(stmt)
        records = list(result.scalars().all())

        record_map = {r.activity_date: r for r in records}

        daily_responses: List[DailyActivityResponse] = []
        curr = start_date
        total_seconds = 0
        assessment_sec = 0
        lesson_sec = 0
        game_sec = 0
        ai_tutor_sec = 0
        general_sec = 0
        active_days = 0

        while curr <= end_date:
            rec = record_map.get(curr)
            if rec:
                daily_resp = self._build_daily_response(rec, preferred_goal)
                total_seconds += rec.total_active_seconds
                assessment_sec += rec.assessment_seconds
                lesson_sec += rec.lesson_seconds
                game_sec += rec.game_seconds
                ai_tutor_sec += rec.ai_tutor_seconds
                general_sec += rec.general_seconds
                if rec.total_active_seconds > 0:
                    active_days += 1
            else:
                daily_resp = DailyActivityResponse(
                    activity_date=curr,
                    total_active_seconds=0,
                    assessment_seconds=0,
                    lesson_seconds=0,
                    game_seconds=0,
                    ai_tutor_seconds=0,
                    general_seconds=0,
                    goal_minutes=preferred_goal,
                    goal_eligible_seconds=0,
                    goal_completed=False,
                    bonus_learning_minutes=0,
                )
            daily_responses.append(daily_resp)
            curr += timedelta(days=1)

        categories = [
            CategoryBreakdown(
                category="lessons",
                label="Lessons",
                seconds=lesson_sec,
                minutes=round(lesson_sec / 60.0, 1),
            ),
            CategoryBreakdown(
                category="assessment",
                label="Assessment",
                seconds=assessment_sec,
                minutes=round(assessment_sec / 60.0, 1),
            ),
            CategoryBreakdown(
                category="games",
                label="Games",
                seconds=game_sec,
                minutes=round(game_sec / 60.0, 1),
            ),
            CategoryBreakdown(
                category="ai_tutor",
                label="AI Tutor",
                seconds=ai_tutor_sec,
                minutes=round(ai_tutor_sec / 60.0, 1),
            ),
            CategoryBreakdown(
                category="general",
                label="General",
                seconds=general_sec,
                minutes=round(general_sec / 60.0, 1),
            ),
        ]

        today_resp = next((r for r in daily_responses if r.activity_date == reference_date), None)
        today_eligible = today_resp.goal_eligible_seconds if today_resp else 0
        today_completed = today_resp.goal_completed if today_resp else False
        today_bonus = today_resp.bonus_learning_minutes if today_resp else 0

        return ActivitySummaryResponse(
            period=period,
            reference_date=reference_date,
            total_active_seconds=total_seconds,
            total_active_minutes=round(total_seconds / 60),
            assessment_seconds=assessment_sec,
            lesson_seconds=lesson_sec,
            game_seconds=game_sec,
            ai_tutor_seconds=ai_tutor_sec,
            general_seconds=general_sec,
            current_goal_minutes=preferred_goal,
            today_goal_eligible_seconds=today_eligible,
            today_goal_completed=today_completed,
            today_bonus_learning_minutes=today_bonus,
            active_days_count=active_days,
            categories=categories,
            daily_records=daily_responses,
        )

    async def get_month_calendar(
        self, user_id: str, year: int, month: int
    ) -> MonthCalendarResponse:
        """
        Efficiently retrieve activity records and daily goal statuses for all calendar days in a specific month.
        Executes a single SQL date-range query.
        """
        preferred_goal = await self._get_user_preferred_goal(user_id)
        days_in_month = calendar.monthrange(year, month)[1]
        start_date = date(year, month, 1)
        end_date = date(year, month, days_in_month)

        stmt = (
            select(LearnerDailyActivity)
            .where(
                LearnerDailyActivity.user_id == user_id,
                LearnerDailyActivity.activity_date >= start_date,
                LearnerDailyActivity.activity_date <= end_date,
            )
            .order_by(LearnerDailyActivity.activity_date.asc())
        )
        result = await self.db.execute(stmt)
        records = list(result.scalars().all())

        record_map = {r.activity_date: r for r in records}

        daily_responses: List[DailyActivityResponse] = []
        total_seconds = 0
        goal_completed_count = 0
        active_days = 0

        for day in range(1, days_in_month + 1):
            d = date(year, month, day)
            rec = record_map.get(d)
            if rec:
                daily_resp = self._build_daily_response(rec, preferred_goal)
                total_seconds += rec.total_active_seconds
                if daily_resp.goal_completed:
                    goal_completed_count += 1
                if rec.total_active_seconds > 0:
                    active_days += 1
            else:
                daily_resp = DailyActivityResponse(
                    activity_date=d,
                    total_active_seconds=0,
                    assessment_seconds=0,
                    lesson_seconds=0,
                    game_seconds=0,
                    ai_tutor_seconds=0,
                    general_seconds=0,
                    goal_minutes=preferred_goal,
                    goal_eligible_seconds=0,
                    goal_completed=False,
                    bonus_learning_minutes=0,
                )
            daily_responses.append(daily_resp)

        return MonthCalendarResponse(
            year=year,
            month=month,
            total_active_seconds=total_seconds,
            total_active_minutes=round(total_seconds / 60),
            goal_completed_days_count=goal_completed_count,
            active_days_count=active_days,
            days_in_month=days_in_month,
            daily_records=daily_responses,
        )

    async def get_streak_stats(
        self, user_id: str, reference_date: Optional[date] = None
    ) -> StreakResponse:
        """
        Dynamically calculate current streak and longest streak derived from historical goal-completed activity records.
        Does NOT break yesterday's streak prematurely when today's goal is still in progress.
        """
        ref_date = reference_date or date.today()
        preferred_goal = await self._get_user_preferred_goal(user_id)

        stmt = (
            select(LearnerDailyActivity)
            .where(LearnerDailyActivity.user_id == user_id)
            .order_by(LearnerDailyActivity.activity_date.asc())
        )
        result = await self.db.execute(stmt)
        records = list(result.scalars().all())

        if not records:
            return StreakResponse(
                current_streak=0,
                longest_streak=0,
                today_completed=False,
                last_completed_date=None,
                is_new_learner=True,
            )

        completed_dates = set()
        for rec in records:
            goal_min = rec.goal_minutes if (rec.goal_minutes and rec.goal_minutes > 0) else preferred_goal
            eligible_sec = rec.assessment_seconds + rec.lesson_seconds + rec.game_seconds + rec.ai_tutor_seconds
            if eligible_sec >= (goal_min * 60) and eligible_sec > 0:
                completed_dates.add(rec.activity_date)

        today_completed = ref_date in completed_dates
        last_completed = max(completed_dates) if completed_dates else None

        # 1. Calculate Current Streak
        current_streak = 0
        check_date = ref_date if today_completed else (ref_date - timedelta(days=1))

        while check_date in completed_dates:
            current_streak += 1
            check_date -= timedelta(days=1)

        # 2. Calculate Longest Historical Streak
        longest_streak = 0
        if completed_dates:
            sorted_dates = sorted(completed_dates)
            curr_seq = 0
            prev_d = None
            for d in sorted_dates:
                if prev_d is None or d == (prev_d + timedelta(days=1)):
                    curr_seq += 1
                else:
                    curr_seq = 1
                if curr_seq > longest_streak:
                    longest_streak = curr_seq
                prev_d = d

        longest_streak = max(longest_streak, current_streak)

        return StreakResponse(
            current_streak=current_streak,
            longest_streak=longest_streak,
            today_completed=today_completed,
            last_completed_date=last_completed,
            is_new_learner=len(records) == 0,
        )
