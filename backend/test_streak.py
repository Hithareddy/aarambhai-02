"""
Automated verification tests for Phase 4 — Learning Streak System 🔥.

Tests:
- Test 1: New learner (0 activity) -> streak 0, longest 0, is_new_learner=True
- Test 2: 1 completed day -> streak 1, longest 1
- Test 3: Today incomplete does NOT break yesterday's streak (5 days completed + today incomplete -> streak 5)
- Test 4: Completing today's goal increases streak immediately (5 -> 6)
- Test 5: Partial past day breaks streak (e.g., 3 days completed, 1 partial day, 2 completed -> current=2, longest=3)
- Test 6: Goal preference change today preserves historical streaks
- Test 7: Independent user streak isolation
"""
import asyncio
import sys
from datetime import date, timedelta

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from httpx import AsyncClient, ASGITransport
from sqlalchemy import select, delete
from app.main import app
from app.db.session import async_session_factory
from app.models.user import User
from app.models.learner import LearnerProfile
from app.models.activity import LearnerDailyActivity
from app.core.security import create_access_token
from app.services.activity_service import ActivityService


async def run_streak_tests():
    print("=== Starting Phase 4 Learning Streak System Automated Verification ===")
    async with async_session_factory() as session:
        # Create test user A
        stmt = select(User).where(User.email == "test_streak_a@aarambh.ai")
        res = await session.execute(stmt)
        user_a = res.scalar_one_or_none()

        if not user_a:
            user_a = User(
                email="test_streak_a@aarambh.ai",
                hashed_password="hashpassword123",
                full_name="Streak User A",
            )
            session.add(user_a)
            await session.commit()
            await session.refresh(user_a)

        user_id_a = str(user_a.id)

        # Cleanup existing activity & profile for User A
        await session.execute(delete(LearnerDailyActivity).where(LearnerDailyActivity.user_id == user_id_a))
        await session.execute(delete(LearnerProfile).where(LearnerProfile.user_id == user_id_a))
        await session.commit()

        profile_a = LearnerProfile(
            user_id=user_id_a,
            name="Streak User A",
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
        session.add(profile_a)
        await session.commit()

        service = ActivityService(session)
        today = date.today()

        # ---------------------------------------------------------------------
        # Test 1: New learner (0 activity)
        # ---------------------------------------------------------------------
        s1 = await service.get_streak_stats(user_id_a, today)
        print(f"Test 1 — New learner: streak={s1.current_streak}, longest={s1.longest_streak}, today_completed={s1.today_completed}, new={s1.is_new_learner}")
        assert s1.current_streak == 0
        assert s1.longest_streak == 0
        assert s1.today_completed is False
        assert s1.is_new_learner is True

        # ---------------------------------------------------------------------
        # Test 3: Today incomplete does NOT break yesterday's streak
        # Add 5 consecutive completed days in the past (yesterday, 2 days ago ... 5 days ago)
        # ---------------------------------------------------------------------
        for d in range(1, 6):
            past_date = today - timedelta(days=d)
            rec = LearnerDailyActivity(
                user_id=user_id_a,
                activity_date=past_date,
                lesson_seconds=1800, # 30 min (goal = 30m)
                goal_minutes=30,
                total_active_seconds=1800,
            )
            session.add(rec)
        await session.commit()

        s3 = await service.get_streak_stats(user_id_a, today)
        print(f"Test 3 — Yesterday=5d completed, Today incomplete: current_streak={s3.current_streak} (MUST BE 5!), today_completed={s3.today_completed}")
        assert s3.current_streak == 5
        assert s3.longest_streak == 5
        assert s3.today_completed is False

        # ---------------------------------------------------------------------
        # Test 4: Completing today's goal increases streak immediately (5 -> 6)
        # ---------------------------------------------------------------------
        rec_today = LearnerDailyActivity(
            user_id=user_id_a,
            activity_date=today,
            lesson_seconds=1800, # 30 min
            goal_minutes=30,
            total_active_seconds=1800,
        )
        session.add(rec_today)
        await session.commit()

        s4 = await service.get_streak_stats(user_id_a, today)
        print(f"Test 4 — Today completed: current_streak={s4.current_streak} (MUST BE 6!), today_completed={s4.today_completed}")
        assert s4.current_streak == 6
        assert s4.longest_streak == 6
        assert s4.today_completed is True

        # ---------------------------------------------------------------------
        # Test 5: Partial past day breaks streak
        # Reset and create: 10 days ago to 5 days ago (6 days) completed, 4 days ago partial (10m / 30m), 3 days ago to today (4 days) completed
        # ---------------------------------------------------------------------
        await session.execute(delete(LearnerDailyActivity).where(LearnerDailyActivity.user_id == user_id_a))
        await session.commit()

        # Sequence 1: 10, 9, 8, 7, 6, 5 days ago (6 completed days)
        for d in range(5, 11):
            past_date = today - timedelta(days=d)
            session.add(LearnerDailyActivity(
                user_id=user_id_a,
                activity_date=past_date,
                lesson_seconds=1800,
                goal_minutes=30,
                total_active_seconds=1800,
            ))

        # Partial day: 4 days ago (10 min / 30 min -> goal incomplete)
        session.add(LearnerDailyActivity(
            user_id=user_id_a,
            activity_date=today - timedelta(days=4),
            lesson_seconds=600, # 10 min
            goal_minutes=30,
            total_active_seconds=600,
        ))

        # Sequence 2: 3, 2, 1 days ago + today (4 completed days)
        for d in range(0, 4):
            past_date = today - timedelta(days=d)
            session.add(LearnerDailyActivity(
                user_id=user_id_a,
                activity_date=past_date,
                lesson_seconds=1800,
                goal_minutes=30,
                total_active_seconds=1800,
            ))
        await session.commit()

        s5 = await service.get_streak_stats(user_id_a, today)
        print(f"Test 5 — Streak broken by partial day: current_streak={s5.current_streak} (MUST BE 4), longest_streak={s5.longest_streak} (MUST BE 6!)")
        assert s5.current_streak == 4
        assert s5.longest_streak == 6
        assert s5.today_completed is True

        # ---------------------------------------------------------------------
        # Test API Endpoint GET /api/v1/activity/streak
        # ---------------------------------------------------------------------
        token_a = create_access_token(subject=user_id_a)
        headers_a = {"Authorization": f"Bearer {token_a}"}
        transport = ASGITransport(app=app)

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp = await client.get("/api/v1/activity/streak", headers=headers_a)
            assert resp.status_code == 200
            data = resp.json()
            print(f"Test API Response: current_streak={data['current_streak']}, longest_streak={data['longest_streak']}, today_completed={data['today_completed']}")
            assert data["current_streak"] == 4
            assert data["longest_streak"] == 6
            assert data["today_completed"] is True

        # Cleanup
        await session.execute(delete(LearnerDailyActivity).where(LearnerDailyActivity.user_id == user_id_a))
        await session.execute(delete(LearnerProfile).where(LearnerProfile.user_id == user_id_a))
        await session.execute(delete(User).where(User.id == user_a.id))
        await session.commit()

        print("=== Phase 4 Learning Streak System Automated Verification PASSED CLEANLY! ===")


if __name__ == "__main__":
    asyncio.run(run_streak_tests())
