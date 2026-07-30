import asyncio
import sys
import uuid
import logging
from datetime import datetime

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import async_session_factory
from app.models.user import User
from app.models.learner import LearnerProfile
from app.models.tutor import TutorConversation, TutorMessage
from app.core.security import create_access_token
from sqlalchemy import text


async def run_tutor_tests():
    logger.info("=== Phase 7A AI Tutor Automated Test Suite ===")

    test_user_id = str(uuid.uuid4())
    test_email = f"tutor_test_{test_user_id[:8]}@aarambh.ai"

    # Setup test user and learner profile
    async with async_session_factory() as session:
        user = User(
            id=test_user_id,
            email=test_email,
            hashed_password="hashpassword123",
            full_name="AI Tutor Learner",
            is_active=True
        )
        session.add(user)
        await session.commit()

        profile = LearnerProfile(
            user_id=test_user_id,
            name="Aarav",
            age_group="18-25",
            educational_background="College",
            current_role="Student",
            learning_goal="General Communication",
            learning_language="en",
            website_language="te",
            daily_goal_minutes=20,
            current_familiarity="Beginner",
            digital_comfort="High",
            tutor_name="Mira"
        )
        session.add(profile)
        await session.commit()

    token = create_access_token(subject=test_user_id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Test 1: Get Tutor Profile
        logger.info("Test 1: GET /api/v1/tutor/profile")
        res1 = await client.get("/api/v1/tutor/profile", headers=headers)
        assert res1.status_code == 200, f"Expected 200, got {res1.status_code}: {res1.text}"
        data1 = res1.json()
        assert data1["tutor_name"] == "Mira"
        assert data1["learner_name"] == "Aarav"
        assert data1["learning_language"] == "en"
        logger.info(f"Test 1 PASSED — Tutor name: '{data1['tutor_name']}'")

        # Test 2: Rename Tutor
        logger.info("Test 2: PUT /api/v1/tutor/name")
        res2 = await client.put("/api/v1/tutor/name", json={"tutor_name": "Aria"}, headers=headers)
        assert res2.status_code == 200, f"Expected 200, got {res2.status_code}: {res2.text}"
        data2 = res2.json()
        assert data2["tutor_name"] == "Aria"
        logger.info(f"Test 2 PASSED — Updated Tutor name to: '{data2['tutor_name']}'")

        # Test 3: Get Conversations (Auto-creates active conversation)
        logger.info("Test 3: GET /api/v1/tutor/conversations")
        res3 = await client.get("/api/v1/tutor/conversations", headers=headers)
        assert res3.status_code == 200, f"Expected 200, got {res3.status_code}: {res3.text}"
        data3 = res3.json()
        assert len(data3) > 0
        conv_id = data3[0]["id"]
        logger.info(f"Test 3 PASSED — Active conversation ID: {conv_id}")

        # Test 4: Get Messages for Active Conversation (Contains initial greeting)
        logger.info("Test 4: GET /api/v1/tutor/conversations/{conv_id}/messages")
        res4 = await client.get(f"/api/v1/tutor/conversations/{conv_id}/messages", headers=headers)
        assert res4.status_code == 200, f"Expected 200, got {res4.status_code}: {res4.text}"
        messages = res4.json()
        assert len(messages) >= 1
        assert messages[0]["role"] == "tutor"
        assert "Aria" in messages[0]["content"] or "Aarav" in messages[0]["content"]
        logger.info(f"Test 4 PASSED — Initial greeting: '{messages[0]['content'][:60]}...'")

        # Test 5: Start New Conversation
        logger.info("Test 5: POST /api/v1/tutor/conversations/new")
        res5 = await client.post("/api/v1/tutor/conversations/new", headers=headers)
        assert res5.status_code == 200, f"Expected 200, got {res5.status_code}: {res5.text}"
        new_conv = res5.json()
        assert new_conv["id"] != conv_id
        logger.info(f"Test 5 PASSED — Created new conversation ID: {new_conv['id']}")

        # Cleanup test user
        async with async_session_factory() as session:
            await session.execute(text("DELETE FROM tutor_messages WHERE user_id = :uid"), {"uid": test_user_id})
            await session.execute(text("DELETE FROM tutor_conversations WHERE user_id = :uid"), {"uid": test_user_id})
            await session.execute(text("DELETE FROM learner_profiles WHERE user_id = :uid"), {"uid": test_user_id})
            await session.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": test_user_id})
            await session.commit()

    logger.info("=== Phase 7A AI Tutor Automated Test Suite PASSED CLEANLY! ===")


if __name__ == "__main__":
    asyncio.run(run_tutor_tests())
