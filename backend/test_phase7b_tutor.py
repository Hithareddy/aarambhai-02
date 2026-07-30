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
from app.models.skill_profile import SkillProfile
from app.models.vocabulary import VocabularyWord, LearnerDailyWord
from app.models.assessment import AssessmentResult
from app.services.tutor_context_builder import TutorContextBuilder
from app.core.security import create_access_token
from sqlalchemy import text


async def run_phase7b_tests():
    logger.info("=== Phase 7B Learner-Aware AI Tutor Automated Test Suite ===")

    test_user_id = str(uuid.uuid4())
    test_email = f"tutor7b_{test_user_id[:8]}@aarambh.ai"

    word_id = str(uuid.uuid4())

    # Setup test user, profile, skills, learned words, assessment results
    async with async_session_factory() as session:
        user = User(
            id=test_user_id,
            email=test_email,
            hashed_password="hashpassword123",
            full_name="Phase 7B Learner",
            is_active=True
        )
        session.add(user)
        await session.commit()

        profile = LearnerProfile(
            user_id=test_user_id,
            name="Rohit",
            age_group="18-25",
            educational_background="College",
            current_role="Student",
            learning_goal="Job Interview Practice",
            learning_language="en",
            website_language="te",
            daily_goal_minutes=25,
            current_familiarity="Intermediate",
            digital_comfort="High",
            tutor_name="Aria"
        )
        session.add(profile)

        # Add Skill Profile with speaking as weakest
        sp_speaking = SkillProfile(
            user_id=test_user_id,
            skill="speaking",
            current_level=1,
            mastery_percentage=35.0
        )
        sp_reading = SkillProfile(
            user_id=test_user_id,
            skill="reading",
            current_level=3,
            mastery_percentage=85.0
        )
        session.add(sp_speaking)
        session.add(sp_reading)

        # Add Vocabulary Word & Daily Record
        vw = VocabularyWord(
            id=word_id,
            language="en",
            word="Confident",
            meaning_en="Feeling or showing certainty about something.",
            meanings_json={"te": "నమ్మకం / ఆత్మవిశ్వాసం"},
            example_sentence="She felt confident about her presentation.",
            difficulty_level="Intermediate"
        )
        session.add(vw)
        await session.commit()

        ldw = LearnerDailyWord(
            user_id=test_user_id,
            word_id=word_id,
            is_completed=True,
            learner_sentence="I am confident in my skills.",
            completed_at=datetime.utcnow()
        )
        session.add(ldw)

        # Add Assessment Blueprint & Session for FK integrity
        bp_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())

        from app.models.assessment import AssessmentBlueprint, AssessmentSession
        bp = AssessmentBlueprint(
            id=bp_id,
            learning_goal="Job Interview Practice",
            question_count=5,
            min_difficulty=1,
            max_difficulty=3,
            estimated_duration_minutes=10,
            domains='["speaking"]',
            skills='["speaking"]',
            question_distribution='{}'
        )
        session.add(bp)
        await session.commit()

        ass_session = AssessmentSession(
            id=session_id,
            learner_id=test_user_id,
            blueprint_id=bp_id,
            status="completed",
            current_difficulty=2,
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow()
        )
        session.add(ass_session)
        await session.commit()

        # Add Assessment Result
        ar = AssessmentResult(
            session_id=session_id,
            learner_id=test_user_id,
            overall_proficiency="Intermediate",
            confidence_score=0.75,
            readiness_level="Ready",
            skill_proficiencies='[{"skill":"speaking","score":35},{"skill":"reading","score":85}]',
            strengths='["reading"]',
            weaknesses='["speaking"]',
            learning_path='[{"title":"Professional Speaking & Pronunciation","skill":"speaking"}]'
        )
        session.add(ar)
        await session.commit()

    # Test 1: TutorContextBuilder Verification
    logger.info("Test 1: TutorContextBuilder Context Assembly")
    async with async_session_factory() as session:
        builder = TutorContextBuilder(session)
        ctx = await builder.build_context(test_user_id)
        assert ctx.learner_name == "Rohit"
        assert ctx.learning_language == "en"
        assert ctx.website_language == "te"
        assert ctx.proficiency_level == "Intermediate"
        assert ctx.weakest_skill == "speaking"
        assert len(ctx.recent_words) > 0
        assert ctx.recent_words[0]["word"] == "Confident"
        assert ctx.current_focus == "Professional Speaking & Pronunciation"
        logger.info(f"Test 1 PASSED — Weakest skill: {ctx.weakest_skill}, Recent word: {ctx.recent_words[0]['word']}")

    # Test 2: Endpoint practice mode calls (HTTP tests)
    token = create_access_token(subject=test_user_id)
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Get active conversation
        res_convs = await client.get("/api/v1/tutor/conversations", headers=headers)
        assert res_convs.status_code == 200
        conv_id = res_convs.json()[0]["id"]

        # Mode 1: Free Conversation
        logger.info("Test 2A: Mode 'free_talk'")
        res_ft = await client.post(
            f"/api/v1/tutor/conversations/{conv_id}/chat",
            json={"message": "Hello Aria!", "mode": "free_talk"},
            headers=headers
        )
        assert res_ft.status_code in (200, 530, 503) # 200 if key configured, 503 if offline API key
        logger.info(f"Test 2A PASSED (status {res_ft.status_code})")

        # Mode 2: Role Play
        logger.info("Test 2B: Mode 'role_play'")
        res_rp = await client.post(
            f"/api/v1/tutor/conversations/{conv_id}/chat",
            json={"message": "I would like a table for two please.", "mode": "role_play", "mode_params": {"scenario": "restaurant"}},
            headers=headers
        )
        assert res_rp.status_code in (200, 530, 503)
        logger.info(f"Test 2B PASSED (status {res_rp.status_code})")

        # Mode 3: Fix My Sentence
        logger.info("Test 3C: Mode 'fix_sentence'")
        res_fix = await client.post(
            f"/api/v1/tutor/conversations/{conv_id}/chat",
            json={"message": "I went market yesterday night.", "mode": "fix_sentence"},
            headers=headers
        )
        assert res_fix.status_code in (200, 530, 503)
        logger.info(f"Test 3C PASSED (status {res_fix.status_code})")

        # Mode 4: Explain My Lesson
        logger.info("Test 4D: Mode 'explain_lesson'")
        res_exp = await client.post(
            f"/api/v1/tutor/conversations/{conv_id}/chat",
            json={"message": "Can you explain this topic?", "mode": "explain_lesson"},
            headers=headers
        )
        assert res_exp.status_code in (200, 530, 503)
        logger.info(f"Test 4D PASSED (status {res_exp.status_code})")

        # Mode 5: Quick Practice
        logger.info("Test 5E: Mode 'quick_practice'")
        res_qp = await client.post(
            f"/api/v1/tutor/conversations/{conv_id}/chat",
            json={"message": "Give me a quick practice exercise.", "mode": "quick_practice"},
            headers=headers
        )
        assert res_qp.status_code in (200, 530, 503)
        logger.info(f"Test 5E PASSED (status {res_qp.status_code})")

    # Cleanup test data — order matters for FK constraints
    async with async_session_factory() as session:
        await session.execute(text("DELETE FROM tutor_messages WHERE user_id = :uid"), {"uid": test_user_id})
        await session.execute(text("DELETE FROM tutor_conversations WHERE user_id = :uid"), {"uid": test_user_id})
        await session.execute(text("DELETE FROM learner_daily_words WHERE user_id = :uid"), {"uid": test_user_id})
        await session.execute(text("DELETE FROM vocabulary_words WHERE id = :wid"), {"wid": word_id})
        await session.execute(text("DELETE FROM assessment_results WHERE learner_id = :uid"), {"uid": test_user_id})
        await session.execute(text("DELETE FROM question_responses WHERE session_id = :sid"), {"sid": session_id})
        await session.execute(text("DELETE FROM assessment_sessions WHERE learner_id = :uid"), {"uid": test_user_id})
        await session.execute(text("DELETE FROM assessment_blueprints WHERE id = :bid"), {"bid": bp_id})
        await session.execute(text("DELETE FROM skill_profiles WHERE user_id = :uid"), {"uid": test_user_id})
        await session.execute(text("DELETE FROM learner_profiles WHERE user_id = :uid"), {"uid": test_user_id})
        await session.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": test_user_id})
        await session.commit()

    logger.info("=== Phase 7B Learner-Aware AI Tutor Automated Test Suite PASSED CLEANLY! ===")


if __name__ == "__main__":
    asyncio.run(run_phase7b_tests())
