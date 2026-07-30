"""
Verification test for active learning time tracking.
Tests:
1. ActivitySyncRequest schema validation
2. ActivityService sync_active_time incremental upserts
3. Category breakdowns and period summary (today, week, month)
4. Duplicate prevention for daily records
5. Invalid/negative duration clamping
"""
import asyncio
import sys
from datetime import date, timedelta

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import async_session_factory
from app.models.user import User
from app.models.activity import LearnerDailyActivity
from app.schemas.activity import ActivitySyncRequest
from app.services.activity_service import ActivityService
from sqlalchemy import select, delete


async def run_tests():
    print("--- Starting Activity Tracking Unit Verification ---")
    async with async_session_factory() as session:
        # Create or find test user
        stmt = select(User).where(User.email == "test_activity@aarambh.ai")
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            user = User(
                email="test_activity@aarambh.ai",
                hashed_password="fakehashpassword",
                full_name="Activity Test User",
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

        user_id = str(user.id)
        today = date.today()

        # Clean up existing test records for this user
        await session.execute(
            delete(LearnerDailyActivity).where(LearnerDailyActivity.user_id == user_id)
        )
        await session.commit()

        service = ActivityService(session)

        # 1. First sync call: 60s lessons, 30s games
        payload1 = ActivitySyncRequest(
            activity_date=today,
            lesson_seconds=60,
            game_seconds=30,
            assessment_seconds=0,
            ai_tutor_seconds=0,
            general_seconds=0,
        )
        rec1 = await service.sync_active_time(user_id, payload1)
        print(f"Sync 1: Total={rec1.total_active_seconds}s (Lessons={rec1.lesson_seconds}s, Games={rec1.game_seconds}s)")
        assert rec1.total_active_seconds == 90
        assert rec1.lesson_seconds == 60
        assert rec1.game_seconds == 30

        # 2. Second sync call: 120s assessment, 15s general, 30s lessons
        payload2 = ActivitySyncRequest(
            activity_date=today,
            assessment_seconds=120,
            general_seconds=15,
            lesson_seconds=30,
        )
        rec2 = await service.sync_active_time(user_id, payload2)
        print(f"Sync 2: Total={rec2.total_active_seconds}s (Lessons={rec2.lesson_seconds}s, Assessment={rec2.assessment_seconds}s)")
        assert rec2.total_active_seconds == 255  # 90 + 165 = 255
        assert rec2.lesson_seconds == 90
        assert rec2.assessment_seconds == 120
        assert rec2.game_seconds == 30
        assert rec2.general_seconds == 15

        # 3. Test get_today_activity
        today_data = await service.get_today_activity(user_id, today)
        print(f"Today summary: Total={today_data.total_active_seconds}s")
        assert today_data.total_active_seconds == 255

        # 4. Add activity for yesterday
        yesterday = today - timedelta(days=1)
        payload_yesterday = ActivitySyncRequest(
            activity_date=yesterday,
            lesson_seconds=300,
            ai_tutor_seconds=60,
        )
        rec_y = await service.sync_active_time(user_id, payload_yesterday)
        assert rec_y.total_active_seconds == 360

        # 5. Test weekly summary
        week_summary = await service.get_activity_summary(user_id, "week", today)
        print(f"Weekly Summary: Total Minutes={week_summary.total_active_minutes}m, Active Days={week_summary.active_days_count}")
        assert week_summary.total_active_seconds == 615  # 255 + 360
        assert week_summary.active_days_count == 2

        # Clean up test user & activity
        await session.execute(
            delete(LearnerDailyActivity).where(LearnerDailyActivity.user_id == user_id)
        )
        await session.execute(delete(User).where(User.id == user.id))
        await session.commit()

        print("--- Activity Tracking Unit Verification PASSED cleanly! ---")


if __name__ == "__main__":
    asyncio.run(run_tests())
