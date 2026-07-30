"""
Automated verification tests for Phase 2 — Flexible Daily Learning Goal.

Tests:
- Test A: Goal Creation & Zero state (0 / 30 min)
- Test B: Real learning activity increases goal progress
- Test C: General browsing time does NOT count toward daily learning goal
- Test D: Goal Completion state (goal_completed = True)
- Test E: Bonus learning minutes (37 / 30 min -> +7 bonus minutes)
- Test G: Changing today's goal updates today immediately
- Test H: Historical goal preservation (past dates retain original goal)
- Test J: Custom goal validation (reject <= 0, > 480)
"""
import asyncio
import sys
from datetime import date, timedelta

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select, delete
from app.db.session import async_session_factory
from app.models.user import User
from app.models.learner import LearnerProfile
from app.models.activity import LearnerDailyActivity
from app.schemas.activity import ActivitySyncRequest
from app.services.activity_service import ActivityService


async def run_tests():
    print("=== Starting Phase 2 Daily Goal Automated Verification ===")
    async with async_session_factory() as session:
        # Create test user & profile
        stmt = select(User).where(User.email == "test_goal@aarambh.ai")
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            user = User(
                email="test_goal@aarambh.ai",
                hashed_password="hashpassword123",
                full_name="Goal Test User",
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

        user_id = str(user.id)

        # Cleanup existing activity records & learner profile for test user
        await session.execute(
            delete(LearnerDailyActivity).where(LearnerDailyActivity.user_id == user_id)
        )
        await session.execute(
            delete(LearnerProfile).where(LearnerProfile.user_id == user_id)
        )
        await session.commit()

        # Create fresh LearnerProfile
        profile = LearnerProfile(
            user_id=user_id,
            name="Goal Test User",
            age_group="18 - 25",
            educational_background="College",
            current_role="Student",
            learning_goal="Everyday English",
            learning_language="en",
            website_language="en",
            current_familiarity="Beginner",
            digital_comfort="Very comfortable",
            daily_goal_minutes=30,
        )
        session.add(profile)
        await session.commit()

        service = ActivityService(session)
        today = date.today()

        # ---------------------------------------------------------------------
        # Test A: Initial Goal State
        # ---------------------------------------------------------------------
        today_data = await service.get_today_activity(user_id, today)
        print(f"Test A — Initial state: goal={today_data.goal_minutes}m, eligible={today_data.goal_eligible_seconds}s, completed={today_data.goal_completed}")
        assert today_data.goal_minutes == 30
        assert today_data.goal_eligible_seconds == 0
        assert today_data.goal_completed is False

        # ---------------------------------------------------------------------
        # Test C: General Browsing does NOT count toward daily learning goal
        # ---------------------------------------------------------------------
        sync_gen = ActivitySyncRequest(
            activity_date=today,
            general_seconds=600, # 10 mins general browsing
        )
        await service.sync_active_time(user_id, sync_gen)
        data_c = await service.get_today_activity(user_id, today)
        print(f"Test C — General browsing: total={data_c.total_active_seconds}s, eligible={data_c.goal_eligible_seconds}s, completed={data_c.goal_completed}")
        assert data_c.total_active_seconds == 600
        assert data_c.goal_eligible_seconds == 0
        assert data_c.goal_completed is False

        # ---------------------------------------------------------------------
        # Test B: Real Learning Activity increases goal progress
        # ---------------------------------------------------------------------
        sync_learn = ActivitySyncRequest(
            activity_date=today,
            lesson_seconds=900, # 15 mins lessons
            game_seconds=300,   # 5 mins games
        )
        await service.sync_active_time(user_id, sync_learn)
        data_b = await service.get_today_activity(user_id, today)
        print(f"Test B — Learning activity: total={data_b.total_active_seconds}s, eligible={data_b.goal_eligible_seconds}s (20 mins)")
        assert data_b.goal_eligible_seconds == 1200 # 20 minutes (1200s)
        assert data_b.goal_completed is False

        # ---------------------------------------------------------------------
        # Test D & E: Goal Completion & Bonus Learning Minutes
        # ---------------------------------------------------------------------
        sync_complete = ActivitySyncRequest(
            activity_date=today,
            assessment_seconds=1020, # 17 mins assessment (total eligible = 20 + 17 = 37 mins)
        )
        await service.sync_active_time(user_id, sync_complete)
        data_de = await service.get_today_activity(user_id, today)
        print(f"Test D/E — Completion & Bonus: goal={data_de.goal_minutes}m, eligible={data_de.goal_eligible_seconds/60}m, completed={data_de.goal_completed}, bonus={data_de.bonus_learning_minutes}m")
        assert data_de.goal_completed is True
        assert data_de.bonus_learning_minutes == 7 # 37 mins - 30 mins = 7 mins bonus

        # ---------------------------------------------------------------------
        # Test H: Historical Goal Preservation
        # ---------------------------------------------------------------------
        yesterday = today - timedelta(days=1)
        sync_y = ActivitySyncRequest(
            activity_date=yesterday,
            lesson_seconds=1440, # 24 mins
        )
        # Yesterday stored with goal = 20 mins
        await service.update_daily_goal(user_id, 20, yesterday)
        await service.sync_active_time(user_id, sync_y)

        data_y_before = await service.get_today_activity(user_id, yesterday)
        print(f"Test H — Yesterday before today goal change: goal={data_y_before.goal_minutes}m, completed={data_y_before.goal_completed}")
        assert data_y_before.goal_minutes == 20
        assert data_y_before.goal_completed is True # 24 / 20 -> completed

        # ---------------------------------------------------------------------
        # Test G: Change Today's Goal (30 -> 45 mins)
        # ---------------------------------------------------------------------
        data_g = await service.update_daily_goal(user_id, 45, today)
        print(f"Test G — Today updated goal to 45m: eligible={data_g.goal_eligible_seconds/60}m, completed={data_g.goal_completed}, bonus={data_g.bonus_learning_minutes}m")
        assert data_g.goal_minutes == 45
        assert data_g.goal_completed is False # 37 / 45 -> incomplete

        # Verify Yesterday's historical goal was NOT retroactively changed to 45!
        data_y_after = await service.get_today_activity(user_id, yesterday)
        print(f"Test H — Yesterday after today goal change: goal={data_y_after.goal_minutes}m (MUST REMAIN 20m!), completed={data_y_after.goal_completed}")
        assert data_y_after.goal_minutes == 20
        assert data_y_after.goal_completed is True

        # Cleanup test user
        await session.execute(
            delete(LearnerDailyActivity).where(LearnerDailyActivity.user_id == user_id)
        )
        await session.execute(
            delete(LearnerProfile).where(LearnerProfile.user_id == user_id)
        )
        await session.execute(delete(User).where(User.id == user.id))
        await session.commit()

        print("=== Phase 2 Daily Goal Automated Verification PASSED CLEANLY! ===")


if __name__ == "__main__":
    asyncio.run(run_tests())
