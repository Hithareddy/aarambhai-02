"""
Service for daily Word of the Day selection, baseline sentence validation, and My Words collection.
"""
import uuid
import re
from datetime import date, datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.vocabulary import VocabularyWord, LearnerDailyWord
from app.models.learner import LearnerProfile
from app.schemas.vocabulary import (
    WordOfTheDayResponse,
    SentenceCheckResponse,
    LearnedWordItem,
    MyWordsResponse,
)

# Seed bank for immediate production readiness across learning languages
INITIAL_VOCABULARY_BANK = [
    {
        "word": "Curious",
        "language": "en",
        "phonetic": "/ˈkjʊər.i.əs/",
        "meaning_en": "Wanting to know or learn something new.",
        "meanings_json": {
            "te": "ఏదైనా విషయం గురించి ఇంకా తెలుసుకోవాలని అనిపించడం.",
            "hi": "उत्सुक - कुछ नया जानने या सीखने की इच्छा।",
            "en": "Wanting to know or learn something new."
        },
        "example_sentence": "I am curious about space exploration.",
        "difficulty_level": "Beginner",
    },
    {
        "word": "Grateful",
        "language": "en",
        "phonetic": "/ˈɡreɪt.fəl/",
        "meaning_en": "Feeling or showing appreciation for kindness or help.",
        "meanings_json": {
            "te": "కృతజ్ఞతతో ఉండటం లేదా సహాయానికి ధన్యవాదాలు తెలియజేయడం.",
            "hi": "कृतज्ञ - किसी की मदद या अच्छाई के प्रति आभार व्यक्त करना।",
            "en": "Feeling or showing appreciation for kindness or help."
        },
        "example_sentence": "I am grateful for my supportive family.",
        "difficulty_level": "Beginner",
    },
    {
        "word": "Explore",
        "language": "en",
        "phonetic": "/ɪkˈsplɔːr/",
        "meaning_en": "To travel through an unfamiliar area to learn about it.",
        "meanings_json": {
            "te": "కొత్త ప్రదేశాలను లేదా విషయాలను అన్వేషించడం.",
            "hi": "खोज करना - नई जगहों या विचारों को जानना।",
            "en": "To travel through an unfamiliar area to learn about it."
        },
        "example_sentence": "I want to explore new cities this summer.",
        "difficulty_level": "Beginner",
    },
    {
        "word": "Confident",
        "language": "en",
        "phonetic": "/ˈkɒn.fɪ.dənt/",
        "meaning_en": "Feeling sure of your abilities or qualities.",
        "meanings_json": {
            "te": "తన సామర్థ్యాలపై నమ్మకంతో ఉండటం (ఆత్మవిశ్వాసం).",
            "hi": "आत्मविश्वासी - अपनी क्षमताओं पर पूरा भरोसा होना।",
            "en": "Feeling sure of your abilities or qualities."
        },
        "example_sentence": "She felt confident before her presentation.",
        "difficulty_level": "Beginner",
    },
    {
        "word": "Persevere",
        "language": "en",
        "phonetic": "/ˌpɜː.sɪˈvɪər/",
        "meaning_en": "To continue doing something despite difficulties or obstacles.",
        "meanings_json": {
            "te": "కష్టాలు ఎదురైనా పట్టుదలతో కొనసాగించడం.",
            "hi": "दृढ़ रहना - कठिनाइयों के बावजूद प्रयास करते रहना।",
            "en": "To continue doing something despite difficulties or obstacles."
        },
        "example_sentence": "If you persevere, you will achieve your learning goals.",
        "difficulty_level": "Intermediate",
    },
    # Hindi Learning Language Words
    {
        "word": "मित्र (Mitra)",
        "language": "hi",
        "phonetic": "/mi-tra/",
        "meaning_en": "Friend - A person you know well and like.",
        "meanings_json": {
            "te": "స్నేహితుడు / మిత్రుడు.",
            "hi": "मित्र - जिससे स्नेह या सच्चा सम्बन्ध हो।",
            "en": "Friend - A person you know well and like."
        },
        "example_sentence": "रोहन मेरा बहुत अच्छा मित्र है।",
        "difficulty_level": "Beginner",
    },
    {
        "word": "प्रयास (Prayas)",
        "language": "hi",
        "phonetic": "/pra-yaas/",
        "meaning_en": "Effort / Attempt - Making an endeavor to achieve something.",
        "meanings_json": {
            "te": "ప్రయత్నం.",
            "hi": "प्रयास - किसी कार्य को करने की कोशिश।",
            "en": "Effort / Attempt - Making an endeavor to achieve something."
        },
        "example_sentence": "सफलता पाने के लिए निरंतर प्रयास ज़रूरी है।",
        "difficulty_level": "Beginner",
    },
    # Telugu Learning Language Words
    {
        "word": "మిత్రుడు (Mitrudu)",
        "language": "te",
        "phonetic": "/mi-tru-du/",
        "meaning_en": "Friend - A person you know well and like.",
        "meanings_json": {
            "te": "స్నేహితుడు / ఆప్తమిత్రుడు.",
            "hi": "मित्र - दोस्त।",
            "en": "Friend - A person you know well and like."
        },
        "example_sentence": "రాముడు నా మంచి మిత్రుడు.",
        "difficulty_level": "Beginner",
    },
    {
        "word": "ప్రయత్నం (Prayatnam)",
        "language": "te",
        "phonetic": "/pra-yat-nam/",
        "meaning_en": "Effort / Attempt - Making an effort to complete a goal.",
        "meanings_json": {
            "te": "ఏదైనా సాధించడానికి చేసే ప్రయత్నం.",
            "hi": "प्रयास - कोशिश।",
            "en": "Effort / Attempt - Making an effort to complete a goal."
        },
        "example_sentence": "ప్రతిరోజూ చదివితే మంచి ఫలితం సాధించవచ్చు.",
        "difficulty_level": "Beginner",
    },
]


class VocabularyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def seed_vocabulary_if_empty(self):
        """Ensure baseline vocabulary bank exists in PostgreSQL database."""
        stmt = select(VocabularyWord)
        result = await self.db.execute(stmt)
        existing = result.scalars().first()
        if not existing:
            for item in INITIAL_VOCABULARY_BANK:
                word_obj = VocabularyWord(
                    id=str(uuid.uuid4()),
                    word=item["word"],
                    language=item["language"],
                    phonetic=item["phonetic"],
                    meaning_en=item["meaning_en"],
                    meanings_json=item["meanings_json"],
                    example_sentence=item["example_sentence"],
                    difficulty_level=item["difficulty_level"],
                )
                self.db.add(word_obj)
            await self.db.commit()

    async def _get_learner_languages(self, user_id: str) -> tuple[str, str]:
        stmt = select(LearnerProfile).where(LearnerProfile.user_id == user_id)
        res = await self.db.execute(stmt)
        prof = res.scalar_one_or_none()
        learning_lang = (prof.learning_language if prof and prof.learning_language else "en").lower()
        website_lang = (prof.website_language if prof and prof.website_language else "en").lower()
        return learning_lang, website_lang

    async def get_today_word(
        self, user_id: str, reference_date: Optional[date] = None
    ) -> WordOfTheDayResponse:
        """
        Retrieves the assigned Word of the Day for a learner on a given calendar date.
        Ensures a stable word per date (page refreshes do not change the word).
        Avoids showing previously completed words.
        """
        await self.seed_vocabulary_if_empty()
        ref_date = reference_date or date.today()
        learning_lang, support_lang = await self._get_learner_languages(user_id)

        # 1. Check if a word is ALREADY assigned for today
        stmt_today = (
            select(LearnerDailyWord)
            .where(
                LearnerDailyWord.user_id == user_id,
                LearnerDailyWord.assigned_date == ref_date,
            )
        )
        res_today = await self.db.execute(stmt_today)
        assigned_rec = res_today.scalar_one_or_none()

        if assigned_rec and assigned_rec.word_rel:
            vw = assigned_rec.word_rel
            support_meaning = (vw.meanings_json or {}).get(support_lang) or vw.meaning_en
            return WordOfTheDayResponse(
                id=vw.id,
                word=vw.word,
                phonetic=vw.phonetic,
                language=vw.language,
                meaning_en=vw.meaning_en,
                meaning_support=support_meaning,
                support_language=support_lang,
                example_sentence=vw.example_sentence,
                assigned_date=assigned_rec.assigned_date,
                is_completed=assigned_rec.is_completed,
                learner_sentence=assigned_rec.learner_sentence,
            )

        # 2. Query words already completed by this user
        stmt_completed = (
            select(LearnerDailyWord.word_id)
            .where(
                LearnerDailyWord.user_id == user_id,
                LearnerDailyWord.is_completed == True,
            )
        )
        res_completed = await self.db.execute(stmt_completed)
        completed_ids = set(res_completed.scalars().all())

        # 3. Query candidate words matching learning language
        stmt_words = select(VocabularyWord).where(VocabularyWord.language == learning_lang)
        res_words = await self.db.execute(stmt_words)
        all_language_words = list(res_words.scalars().all())

        # Fallback to English if no words match the target language yet
        if not all_language_words:
            stmt_en = select(VocabularyWord).where(VocabularyWord.language == "en")
            res_en = await self.db.execute(stmt_en)
            all_language_words = list(res_en.scalars().all())

        # Filter out completed words
        unlearned_candidates = [w for w in all_language_words if w.id not in completed_ids]

        # If learner finished all available words, cycle through all words
        candidate_pool = unlearned_candidates if unlearned_candidates else all_language_words

        # Deterministic stable selection hash based on user_id + ref_date
        hash_seed = abs(hash(f"{user_id}_{ref_date.isoformat()}"))
        chosen_word = candidate_pool[hash_seed % len(candidate_pool)]

        # Save assignment
        new_assignment = LearnerDailyWord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            word_id=chosen_word.id,
            assigned_date=ref_date,
            is_completed=False,
        )
        self.db.add(new_assignment)
        await self.db.commit()
        await self.db.refresh(new_assignment)

        support_meaning = (chosen_word.meanings_json or {}).get(support_lang) or chosen_word.meaning_en

        return WordOfTheDayResponse(
            id=chosen_word.id,
            word=chosen_word.word,
            phonetic=chosen_word.phonetic,
            language=chosen_word.language,
            meaning_en=chosen_word.meaning_en,
            meaning_support=support_meaning,
            support_language=support_lang,
            example_sentence=chosen_word.example_sentence,
            assigned_date=ref_date,
            is_completed=False,
            learner_sentence=None,
        )

    async def check_sentence(
        self, user_id: str, sentence: str, reference_date: Optional[date] = None
    ) -> SentenceCheckResponse:
        """
        Validates learner sentence attempt for today's word.
        Provides helpful feedback without fake AI.
        Persists completion upon success.
        """
        ref_date = reference_date or date.today()
        today_word_resp = await self.get_today_word(user_id, ref_date)

        clean_sentence = sentence.strip()
        if not clean_sentence:
            return SentenceCheckResponse(
                is_valid=False,
                feedback_message="Please write a sentence using the word before submitting.",
                is_completed=today_word_resp.is_completed,
                learned_word=today_word_resp,
            )

        target_word = today_word_resp.word
        # Extract base term (e.g., 'Curious' -> 'curious', 'मित्र (Mitra)' -> 'mitra' or 'मित्र')
        clean_word_tokens = re.findall(r'\w+', target_word.lower())
        sentence_lower = clean_sentence.lower()

        # Check if target word or any of its main tokens appear in sentence
        word_found = any(token in sentence_lower for token in clean_word_tokens if len(token) > 2)

        if not word_found:
            return SentenceCheckResponse(
                is_valid=False,
                feedback_message=f'🟡 Almost there! Make sure your sentence includes the word "{target_word}". Try using it like: "{today_word_resp.example_sentence}"',
                is_completed=today_word_resp.is_completed,
                learned_word=today_word_resp,
            )

        # Minimum length / word count check
        words_in_sentence = clean_sentence.split()
        if len(words_in_sentence) < 3:
            return SentenceCheckResponse(
                is_valid=False,
                feedback_message=f'🟡 Try writing a full sentence with at least 3 words, e.g.: "{today_word_resp.example_sentence}"',
                is_completed=today_word_resp.is_completed,
                learned_word=today_word_resp,
            )

        # Success: Persist completion in database
        stmt_rec = select(LearnerDailyWord).where(
            LearnerDailyWord.user_id == user_id,
            LearnerDailyWord.assigned_date == ref_date,
        )
        res_rec = await self.db.execute(stmt_rec)
        rec = res_rec.scalar_one_or_none()

        if rec:
            rec.is_completed = True
            rec.learner_sentence = clean_sentence
            rec.completed_at = datetime.utcnow()
            await self.db.commit()

        updated_today_word = await self.get_today_word(user_id, ref_date)

        return SentenceCheckResponse(
            is_valid=True,
            feedback_message=f'✅ Great job! You used "{target_word}" correctly in your sentence.',
            is_completed=True,
            learned_word=updated_today_word,
        )

    async def get_my_words(self, user_id: str) -> MyWordsResponse:
        """
        Retrieves all previously learned vocabulary items for 'My Words' collection.
        """
        learning_lang, support_lang = await self._get_learner_languages(user_id)
        stmt = (
            select(LearnerDailyWord)
            .where(
                LearnerDailyWord.user_id == user_id,
                LearnerDailyWord.is_completed == True,
            )
            .order_by(LearnerDailyWord.completed_at.desc())
        )
        res = await self.db.execute(stmt)
        records = list(res.scalars().all())

        items: List[LearnedWordItem] = []
        for rec in records:
            if rec.word_rel:
                vw = rec.word_rel
                support_meaning = (vw.meanings_json or {}).get(support_lang) or vw.meaning_en
                items.append(
                    LearnedWordItem(
                        id=vw.id,
                        word=vw.word,
                        phonetic=vw.phonetic,
                        language=vw.language,
                        meaning_en=vw.meaning_en,
                        meaning_support=support_meaning,
                        example_sentence=vw.example_sentence,
                        learner_sentence=rec.learner_sentence or "",
                        learned_date=rec.assigned_date,
                    )
                )

        return MyWordsResponse(
            total_count=len(items),
            words=items,
        )
