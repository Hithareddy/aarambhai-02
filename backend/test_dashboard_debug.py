"""
Debug script to simulate frontend getDashboardSnapshot() and useActivitySummary() calls.
Tests the exact HTTP API responses for a registered user.
"""
import asyncio
import sys
from httpx import AsyncClient, ASGITransport

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.main import app
from app.db.session import async_session_factory
from app.models.user import User
from app.models.learner import LearnerProfile
from app.core.security import create_access_token
from sqlalchemy import select, delete


async def test_dashboard_apis():
    print("=== Testing Backend Dashboard & Activity APIs ===")
    async with async_session_factory() as session:
        # Create test user
        stmt = select(User).where(User.email == "debug_dash@aarambh.ai")
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            user = User(
                email="debug_dash@aarambh.ai",
                hashed_password="hashpassword123",
                full_name="Debug Dash User",
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

        user_id = str(user.id)

        # Create learner profile
        stmt_p = select(LearnerProfile).where(LearnerProfile.user_id == user_id)
        res_p = await session.execute(stmt_p)
        prof = res_p.scalar_one_or_none()
        if not prof:
            prof = LearnerProfile(
                user_id=user_id,
                name="Debug Dash User",
                age_group="18 - 25",
                educational_background="College",
                current_role="Student",
                learning_goal="Everyday English",
                learning_language="en",
                website_language="en",
                current_familiarity="Beginner",
                digital_comfort="Very comfortable",
                daily_goal_minutes=20,
            )
            session.add(prof)
            await session.commit()

        token = create_access_token(subject=user_id)
        headers = {"Authorization": f"Bearer {token}"}

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            print("\n1. Testing GET /api/v1/auth/me")
            r1 = await client.get("/api/v1/auth/me", headers=headers)
            print(f"Status: {r1.status_code}, Response: {r1.json()}")

            print("\n2. Testing GET /api/v1/learners/me")
            r2 = await client.get("/api/v1/learners/me", headers=headers)
            print(f"Status: {r2.status_code}, Response: {r2.json()}")

            print("\n3. Testing GET /api/v1/activity/summary?period=today")
            r3 = await client.get("/api/v1/activity/summary?period=today", headers=headers)
            print(f"Status: {r3.status_code}, Response: {r3.json()}")

            print("\n4. Testing GET /api/v1/activity/summary?period=week")
            r4 = await client.get("/api/v1/activity/summary?period=week", headers=headers)
            print(f"Status: {r4.status_code}, Response: {r4.json()}")

            print("\n5. Testing GET /api/v1/activity/summary?period=month")
            r5 = await client.get("/api/v1/activity/summary?period=month", headers=headers)
            print(f"Status: {r5.status_code}, Response: {r5.json()}")

            print("\n6. Testing PUT /api/v1/activity/goal")
            r6 = await client.put("/api/v1/activity/goal", json={"goal_minutes": 30}, headers=headers)
            print(f"Status: {r6.status_code}, Response: {r6.json()}")

        # Clean up
        await session.execute(delete(LearnerProfile).where(LearnerProfile.user_id == user_id))
        await session.execute(delete(User).where(User.id == user.id))
        await session.commit()
    print("\n=== Finished Backend Debug Test ===")


if __name__ == "__main__":
    asyncio.run(test_dashboard_apis())
