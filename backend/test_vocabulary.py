"""
Automated verification tests for Phase 5 — 🌱 Word of the Day + My Words.
"""
import asyncio
import sys
from datetime import date, timedelta

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from httpx import AsyncClient, ASGITransport
from sqlalchemy import select, delete
from app.main import app
from app.db.session import async_session_factory, init_db
from app.models.user import User
from app.models.learner import LearnerProfile
from app.models.vocabulary import VocabularyWord, LearnerDailyWord
from app.core.security import create_access_token
from app.services.vocabulary_service import VocabularyService


async def run_vocabulary_tests():
    print("=== Starting Phase 5 Word of the Day & My Words Automated Verification ===")
    await init_db()
    async with async_session_factory() as session:
        # Create test user
        stmt = select(User).where(User.email == "vocab_test@aarambh.ai")
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()

        if not user:
            user = User(
                email="vocab_test@aarambh.ai",
                hashed_password="hashpassword123",
                full_name="Vocab Test Learner",
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

        user_id = str(user.id)

        # Cleanup existing vocabulary history & profile
        await session.execute(delete(LearnerDailyWord).where(LearnerDailyWord.user_id == user_id))
        await session.execute(delete(LearnerProfile).where(LearnerProfile.user_id == user_id))
        await session.commit()

        # Create learner profile (learning_language = 'en', website_language = 'te')
        profile = LearnerProfile(
            user_id=user_id,
            name="Vocab Test Learner",
            age_group="18 - 25",
            educational_background="College",
            current_role="Student",
            learning_goal="Everyday English",
            learning_language="en",
            website_language="te",
            current_familiarity="Beginner",
            digital_comfort="Very comfortable",
            daily_goal_minutes=30,
        )
        session.add(profile)
        await session.commit()

        service = VocabularyService(session)
        today = date.today()

        # ---------------------------------------------------------------------
        # Test 1 & 2: Get today's word (English learning language + Telugu support)
        # ---------------------------------------------------------------------
        word_today = await service.get_today_word(user_id, today)
        print(f"Test 1 & 2 — Word of the Day: '{word_today.word}', meaning_en='{word_today.meaning_en}'")
        assert word_today.word is not None
        assert word_today.language == "en"
        assert word_today.is_completed is False

        # ---------------------------------------------------------------------
        # Test 3: Refresh stability (multiple calls return EXACT SAME word)
        # ---------------------------------------------------------------------
        word_refresh = await service.get_today_word(user_id, today)
        print(f"Test 3 — Refresh stability check: word='{word_refresh.word}' (MUST MATCH '{word_today.word}')")
        assert word_refresh.id == word_today.id
        assert word_refresh.word == word_today.word

        # ---------------------------------------------------------------------
        # Test 4: Empty sentence rejection
        # ---------------------------------------------------------------------
        check_empty = await service.check_sentence(user_id, "   ", today)
        print(f"Test 4 — Empty sentence: valid={check_empty.is_valid}, msg='{check_empty.feedback_message}'")
        assert check_empty.is_valid is False

        # ---------------------------------------------------------------------
        # Test 5: Missing target word rejection
        # ---------------------------------------------------------------------
        check_missing = await service.check_sentence(user_id, "I love reading books every morning.", today)
        print(f"Test 5 — Missing target word: valid={check_missing.is_valid}")
        assert check_missing.is_valid is False
        assert "Almost there!" in check_missing.feedback_message

        # ---------------------------------------------------------------------
        # Test 6: Valid sentence submission & completion
        # ---------------------------------------------------------------------
        valid_sentence = f"I am very {word_today.word.lower()} about the stars."
        check_valid = await service.check_sentence(user_id, valid_sentence, today)
        print(f"Test 6 — Valid sentence: valid={check_valid.is_valid}")
        assert check_valid.is_valid is True
        assert check_valid.is_completed is True

        # ---------------------------------------------------------------------
        # Test 7: Persistence check (get_today_word now returns completed=True)
        # ---------------------------------------------------------------------
        word_persisted = await service.get_today_word(user_id, today)
        print(f"Test 7 — Persistence check: is_completed={word_persisted.is_completed}, sentence='{word_persisted.learner_sentence}'")
        assert word_persisted.is_completed is True
        assert word_persisted.learner_sentence == valid_sentence

        # ---------------------------------------------------------------------
        # Test 8: Unlearned candidates on future date
        # ---------------------------------------------------------------------
        tomorrow = today + timedelta(days=1)
        word_tomorrow = await service.get_today_word(user_id, tomorrow)
        print(f"Test 8 — Tomorrow word: '{word_tomorrow.word}' (MUST NOT BE '{word_today.word}')")
        assert word_tomorrow.id != word_today.id

        # ---------------------------------------------------------------------
        # Test 9: My Words collection
        # ---------------------------------------------------------------------
        my_words = await service.get_my_words(user_id)
        print(f"Test 9 — My Words collection count: {my_words.total_count}")
        assert my_words.total_count == 1
        assert my_words.words[0].word == word_today.word
        assert my_words.words[0].learner_sentence == valid_sentence

        # ---------------------------------------------------------------------
        # Test 11: HTTP API Endpoints Test
        # ---------------------------------------------------------------------
        token = create_access_token(subject=user_id)
        headers = {"Authorization": f"Bearer {token}"}
        transport = ASGITransport(app=app)

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            resp_today = await client.get("/api/v1/vocabulary/today", headers=headers)
            assert resp_today.status_code == 200
            assert resp_today.json()["is_completed"] is True

            resp_my_words = await client.get("/api/v1/vocabulary/my-words", headers=headers)
            assert resp_my_words.status_code == 200
            assert resp_my_words.json()["total_count"] == 1

            print("Test 11 — HTTP API endpoints /vocabulary/today and /vocabulary/my-words PASSED!")

        # Cleanup
        await session.execute(delete(LearnerDailyWord).where(LearnerDailyWord.user_id == user_id))
        await session.execute(delete(LearnerProfile).where(LearnerProfile.user_id == user_id))
        await session.execute(delete(User).where(User.id == user.id))
        await session.commit()

        print("=== Phase 5 Word of the Day & My Words Automated Verification PASSED CLEANLY! ===")


if __name__ == "__main__":
    asyncio.run(run_vocabulary_tests())
