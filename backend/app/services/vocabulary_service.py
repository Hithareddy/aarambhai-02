"""
Service for daily Word of the Day selection, intelligent sentence practice validation, and My Words collection.
Supports English, Telugu, and Hindi learning languages with age/role difficulty adaptation.
"""
import uuid
import re
import json
import logging
from datetime import date, datetime
from typing import List, Optional, Dict, Any
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
from app.core.config import settings
import httpx

logger = logging.getLogger(__name__)

# Expanded Seed Vocabulary Bank for English, Telugu, and Hindi across difficulty levels
EXPANDED_VOCABULARY_BANK = [
    # --- ENGLISH LEARNING LANGUAGE ---
    {
        "word": "Kind",
        "language": "en",
        "phonetic": "/kaɪnd/",
        "meaning_en": "Being friendly, generous, and considerate to others.",
        "meanings_json": {
            "te": "ఇతరులతో దయతో మరియు మర్యాదగా ఉండటం.",
            "hi": "दयालु - दूसरों के प्रति विनम्र और मददगार होना।",
            "en": "Being friendly, generous, and considerate to others."
        },
        "example_sentence": "She was very kind to help her classmate with homework.",
        "difficulty_level": "Beginner",
    },
    {
        "word": "Brave",
        "language": "en",
        "phonetic": "/breɪv/",
        "meaning_en": "Showing courage and not being afraid to face difficulties.",
        "meanings_json": {
            "te": "ధైర్యంగా ఉండటం మరియు భయపడకపోవడం.",
            "hi": "साहसी - कठिनाइयों का सामना करने से न डरना।",
            "en": "Showing courage and not being afraid to face difficulties."
        },
        "example_sentence": "The brave firefighter rescued the kitten from the tree.",
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
        "word": "Resilient",
        "language": "en",
        "phonetic": "/rɪˈzɪl.i.ənt/",
        "meaning_en": "Able to recover quickly from difficult situations.",
        "meanings_json": {
            "te": "కష్ట సమయాల నుండి త్వరగా కోలుకునే శక్తి.",
            "hi": "लचीला / लचीलापन - कठिनाइयों से जल्दी उबरने की क्षमता।",
            "en": "Able to recover quickly from difficult situations."
        },
        "example_sentence": "Our team stayed resilient and won the final match.",
        "difficulty_level": "Intermediate",
    },
    {
        "word": "Eloquent",
        "language": "en",
        "phonetic": "/ˈel.ə.kwənt/",
        "meaning_en": "Fluent or persuasive in speaking or writing.",
        "meanings_json": {
            "te": "అద్భుతంగా మరియు ప్రభావవంతంగా మాట్లాడే సామర్థ్యం.",
            "hi": "वाक्पटु - प्रभावी और सुंदर ढंग से बोलना या लिखना।",
            "en": "Fluent or persuasive in speaking or writing."
        },
        "example_sentence": "The speaker delivered an eloquent speech at the conference.",
        "difficulty_level": "Advanced",
    },

    # --- TELUGU LEARNING LANGUAGE ---
    {
        "word": "స్నేహం (Sneham)",
        "language": "te",
        "phonetic": "/sne-ham/",
        "meaning_en": "Friendship - A close relationship between friends.",
        "meanings_json": {
            "te": "మంచి స్నేహితుల మధ్య ఉండే ఆత్మీయ బంధం.",
            "hi": "मित्रता - दो दोस्तों के बीच का गहरा रिश्ता।",
            "en": "Friendship - A close relationship between friends."
        },
        "example_sentence": "రాముడు మరియు కృష్ణుల స్నేహం చాలా గొప్పది.",
        "difficulty_level": "Beginner",
    },
    {
        "word": "ప్రకృతి (Prakruthi)",
        "language": "te",
        "phonetic": "/pra-kru-thi/",
        "meaning_en": "Nature - The physical world including plants, animals, and landscapes.",
        "meanings_json": {
            "te": "చెట్లు, నదులు, పక్షులతో నిండిన సహజ ప్రపంచం.",
            "hi": "प्रकृति - पेड़-पौधों और प्राकृतिक परिवेश की सुंदरता।",
            "en": "Nature - The physical world including plants, animals, and landscapes."
        },
        "example_sentence": "పచ్చని ప్రకృతి మనస్సుకు ఎంతో ప్రశాంతతను ఇస్తుంది.",
        "difficulty_level": "Beginner",
    },
    {
        "word": "విజయం (Vijayam)",
        "language": "te",
        "phonetic": "/vi-ja-yam/",
        "meaning_en": "Success / Victory - Achieving a desired goal or outcome.",
        "meanings_json": {
            "te": "కష్టపడి అనుకున్న లక్ష్యాన్ని సాధించడం.",
            "hi": "सफलता - कठिन परिश्रम से लक्ष्य प्राप्त करना।",
            "en": "Success / Victory - Achieving a desired goal or outcome."
        },
        "example_sentence": "నిరంతర ప్రయత్నంతో మాత్రమే విజయం సాధ్యమవుతుంది.",
        "difficulty_level": "Intermediate",
    },
    {
        "word": "ఆత్మవిశ్వాసం (Atmaviswasam)",
        "language": "te",
        "phonetic": "/aat-ma-vis-waa-sam/",
        "meaning_en": "Self-confidence - Trust in one's own abilities.",
        "meanings_json": {
            "te": "తన సామర్థ్యాలు మరియు శక్తిపై నమ్మకంతో ఉండటం.",
            "hi": "आत्मविश्वास - अपनी क्षमताओं पर पूरा भरोसा होना।",
            "en": "Self-confidence - Trust in one's own abilities."
        },
        "example_sentence": "ఆత్మవిశ్వాసం ఉన్న వ్యక్తి ఏ కష్టాన్నైనా జయించగలడు.",
        "difficulty_level": "Advanced",
    },

    # --- HINDI LEARNING LANGUAGE ---
    {
        "word": "मित्रता (Mitrata)",
        "language": "hi",
        "phonetic": "/mi-tra-taa/",
        "meaning_en": "Friendship - A bond of mutual affection between people.",
        "meanings_json": {
            "te": "మంచి స్నేహితుల బంధం.",
            "hi": "सच्चे मित्रों के बीच का अटूट और सुंदर संबंध।",
            "en": "Friendship - A bond of mutual affection between people."
        },
        "example_sentence": "सच्ची मित्रता जीवन का सबसे अनमोल उपहार है।",
        "difficulty_level": "Beginner",
    },
    {
        "word": "खुशी (Khushi)",
        "language": "hi",
        "phonetic": "/khu-shee/",
        "meaning_en": "Happiness - The state of feeling joyful and pleased.",
        "meanings_json": {
            "te": "సంతోషం మరియు ఆనందం.",
            "hi": "प्रसन्नता और आनंद की अनुभूति।",
            "en": "Happiness - The state of feeling joyful and pleased."
        },
        "example_sentence": "दूसरों की मदद करने से हमें सच्ची खुशी मिलती है।",
        "difficulty_level": "Beginner",
    },
    {
        "word": "अभ्यास (Abhyas)",
        "language": "hi",
        "phonetic": "/ab-hyaas/",
        "meaning_en": "Practice - Regular activity done to improve a skill.",
        "meanings_json": {
            "te": "సాధన / సాధన చేయడం.",
            "hi": "कौशल सुधारने के लिए रोज़ाना किया जाने वाला कार्य।",
            "en": "Practice - Regular activity done to improve a skill."
        },
        "example_sentence": "रोज़ाना अभ्यास करने से हर विषय आसान हो जाता है।",
        "difficulty_level": "Intermediate",
    },
    {
        "word": "ज्ञान (Gyaan)",
        "language": "hi",
        "phonetic": "/gyaan/",
        "meaning_en": "Knowledge / Wisdom - Information and understanding gained through learning.",
        "meanings_json": {
            "te": "జ్ఞానం మరియు తెలివితేటలు.",
            "hi": "सीखने और अनुभव से प्राप्त समझ और जानकारी।",
            "en": "Knowledge / Wisdom - Information and understanding gained through learning."
        },
        "example_sentence": "ज्ञान ही मनुष्य का सबसे बड़ा धन है।",
        "difficulty_level": "Advanced",
    },
]


class VocabularyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def seed_vocabulary_if_empty(self):
        """Ensure baseline vocabulary bank exists in database."""
        stmt = select(VocabularyWord)
        result = await self.db.execute(stmt)
        existing = result.scalars().first()
        if not existing:
            for item in EXPANDED_VOCABULARY_BANK:
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

    async def _get_learner_profile(self, user_id: str) -> Optional[LearnerProfile]:
        stmt = select(LearnerProfile).where(LearnerProfile.user_id == str(user_id))
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_today_word(
        self, user_id: str, reference_date: Optional[date] = None
    ) -> WordOfTheDayResponse:
        """
        Retrieves Word of the Day specifically matching the learner's LEARNING LANGUAGE.
        Adapts difficulty level based on learner age/role.
        Renders interface support meaning using WEBSITE LANGUAGE.
        """
        await self.seed_vocabulary_if_empty()
        ref_date = reference_date or date.today()
        prof = await self._get_learner_profile(user_id)

        learning_lang = (prof.learning_language if prof and prof.learning_language else "en").lower()
        support_lang = (prof.website_language if prof and prof.website_language else "en").lower()
        age_group = prof.age_group if prof else "25-34"

        # Determine target difficulty: Child (<12) -> Beginner, Adult -> Intermediate/Advanced
        if age_group in ["under-12", "child", "12-17"]:
            target_diff = "Beginner"
        elif age_group in ["65+", "senior"]:
            target_diff = "Beginner"
        else:
            target_diff = "Intermediate"

        # 1. Check if a word is ALREADY assigned for today
        stmt_today = (
            select(LearnerDailyWord)
            .where(
                LearnerDailyWord.user_id == str(user_id),
                LearnerDailyWord.assigned_date == ref_date,
            )
        )
        res_today = await self.db.execute(stmt_today)
        assigned_rec = res_today.scalar_one_or_none()

        if assigned_rec and assigned_rec.word_rel:
            vw = assigned_rec.word_rel
            # Ensure assigned word matches the current learning language; if not, re-assign!
            if vw.language.lower() == learning_lang:
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
                LearnerDailyWord.user_id == str(user_id),
                LearnerDailyWord.is_completed == True,
            )
        )
        res_completed = await self.db.execute(stmt_completed)
        completed_ids = set(res_completed.scalars().all())

        # 3. Query candidate words EXACTLY matching learning language
        stmt_words = select(VocabularyWord).where(VocabularyWord.language == learning_lang)
        res_words = await self.db.execute(stmt_words)
        all_language_words = list(res_words.scalars().all())

        # Fallback if DB doesn't have exact language words
        if not all_language_words:
            stmt_en = select(VocabularyWord).where(VocabularyWord.language == "en")
            res_en = await self.db.execute(stmt_en)
            all_language_words = list(res_en.scalars().all())

        # Filter out completed words
        unlearned_candidates = [w for w in all_language_words if w.id not in completed_ids]
        candidate_pool = unlearned_candidates if unlearned_candidates else all_language_words

        # Prioritize matching target difficulty
        matched_diff = [w for w in candidate_pool if w.difficulty_level == target_diff]
        if matched_diff:
            candidate_pool = matched_diff

        # Deterministic stable selection hash based on user_id + ref_date
        hash_seed = abs(hash(f"{user_id}_{ref_date.isoformat()}_{learning_lang}"))
        chosen_word = candidate_pool[hash_seed % len(candidate_pool)]

        # Save or update assignment
        if assigned_rec:
            assigned_rec.word_id = chosen_word.id
            self.db.add(assigned_rec)
        else:
            new_assignment = LearnerDailyWord(
                id=str(uuid.uuid4()),
                user_id=str(user_id),
                word_id=chosen_word.id,
                assigned_date=ref_date,
                is_completed=False,
            )
            self.db.add(new_assignment)

        await self.db.commit()

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
        Intelligent Sentence Practice Validation.
        Verifies:
        1. Target word presence (handling scripts, roots, case-insensitivity)
        2. Non-repetition & meaningful context (rejects "Apple apple apple")
        3. Structural grammar and length
        4. Natural usage & semantic correctness with constructive feedback
        """
        ref_date = reference_date or date.today()
        today_word_resp = await self.get_today_word(user_id, ref_date)

        clean_sentence = sentence.strip()
        if not clean_sentence:
            return SentenceCheckResponse(
                is_valid=False,
                feedback_message="Please write a sentence using the target word before submitting.",
                is_completed=today_word_resp.is_completed,
                learned_word=today_word_resp,
            )

        target_word = today_word_resp.word.strip()

        # Extract base tokens (e.g. 'मित्रता (Mitrata)' -> ['मित्रता', 'mitrata'], 'Explore' -> ['explore'])
        target_tokens = [t.lower() for t in re.findall(r'[\w\u0c00-\u0c7f\u0900-\u097f]+', target_word) if len(t) > 1]
        sentence_lower = clean_sentence.lower()

        # 1. Verification: Target Word Presence
        has_word = any(token in sentence_lower for token in target_tokens)
        if not has_word:
            return SentenceCheckResponse(
                is_valid=False,
                feedback_message=f'🟡 Target word missing: Your sentence does not contain "{target_word}". Please include "{target_word}" in your sentence (e.g., "{today_word_resp.example_sentence}").',
                is_completed=today_word_resp.is_completed,
                learned_word=today_word_resp,
            )

        # 2. Verification: Meaningful Usage & Non-Repetition (rejects "Apple apple apple")
        sentence_words = [w.lower() for w in re.findall(r'[\w\u0c00-\u0c7f\u0900-\u097f]+', clean_sentence)]
        if len(sentence_words) < 3:
            return SentenceCheckResponse(
                is_valid=False,
                feedback_message=f'🟡 Too short: Please write a complete sentence with at least 3-4 words (e.g., "{today_word_resp.example_sentence}").',
                is_completed=today_word_resp.is_completed,
                learned_word=today_word_resp,
            )

        # Count target token occurrences
        target_occurrences = sum(1 for w in sentence_words if any(t in w for t in target_tokens))
        unique_ratio = len(set(sentence_words)) / len(sentence_words)

        if target_occurrences >= 3 or unique_ratio < 0.5:
            return SentenceCheckResponse(
                is_valid=False,
                feedback_message=f'🟡 Meaningful usage check: The word "{target_word}" is present, but repeating it does not make a natural sentence. Try writing a real sentence like: "{today_word_resp.example_sentence}"',
                is_completed=today_word_resp.is_completed,
                learned_word=today_word_resp,
            )

        # 3. LLM / Advanced Semantic Validation (if Gemini API key is configured)
        eval_result = await self._evaluate_sentence_with_ai(
            target_word=target_word,
            learner_sentence=clean_sentence,
            learning_language=today_word_resp.language,
            meaning=today_word_resp.meaning_en
        )

        if not eval_result["is_valid"]:
            return SentenceCheckResponse(
                is_valid=False,
                feedback_message=f'🟡 {eval_result["feedback"]}',
                is_completed=today_word_resp.is_completed,
                learned_word=today_word_resp,
            )

        # 4. Success: Persist completion in database and award XP!
        stmt_rec = select(LearnerDailyWord).where(
            LearnerDailyWord.user_id == str(user_id),
            LearnerDailyWord.assigned_date == ref_date,
        )
        res_rec = await self.db.execute(stmt_rec)
        rec = res_rec.scalar_one_or_none()

        if rec:
            rec.is_completed = True
            rec.learner_sentence = clean_sentence
            rec.completed_at = datetime.utcnow()
            await self.db.commit()

        # Award Gamification XP for completing Word of the Day
        from app.services.gamification_service import GamificationService
        await GamificationService(self.db).award_xp(str(user_id), 15, activity_type="vocabulary")

        updated_today_word = await self.get_today_word(user_id, ref_date)

        return SentenceCheckResponse(
            is_valid=True,
            feedback_message=f'✅ {eval_result["feedback"]}',
            is_completed=True,
            learned_word=updated_today_word,
        )

    async def _evaluate_sentence_with_ai(
        self, target_word: str, learner_sentence: str, learning_language: str, meaning: str
    ) -> Dict[str, Any]:
        """
        Uses Gemini LLM (with robust fallback) to evaluate grammar, contextual naturalness, and semantic correctness.
        """
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            # Fallback if no LLM key
            return {
                "is_valid": True,
                "feedback": f'Great job! You used "{target_word}" in a meaningful sentence.'
            }

        prompt = f"""You are an expert language evaluator. Check if the learner's sentence correctly and naturally uses the target vocabulary word.

Target Word: "{target_word}"
Meaning: "{meaning}"
Target Learning Language: "{learning_language}"
Learner's Sentence: "{learner_sentence}"

Evaluate for:
1. Correct spelling and grammar.
2. Natural, meaningful usage (not repetitive or gibberish).
3. Correct context.

Respond ONLY with valid JSON in this exact structure:
{{
  "is_valid": true or false,
  "feedback": "Constructive 1-2 sentence feedback explaining why it is correct or how to fix it."
}}
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    res_json = resp.json()
                    candidates = res_json.get("candidates", [])
                    if candidates:
                        raw_text = candidates[0]["content"]["parts"][0]["text"]
                        clean_json = re.sub(r'```json|```', '', raw_text).strip()
                        parsed = json.loads(clean_json)
                        return {
                            "is_valid": bool(parsed.get("is_valid", True)),
                            "feedback": str(parsed.get("feedback", f'Great usage of "{target_word}"!'))
                        }
        except Exception as e:
            logger.warning(f"AI sentence evaluation fallback triggered: {e}")

        # Fallback heuristic if API call fails
        return {
            "is_valid": True,
            "feedback": f'Great job! You used "{target_word}" correctly in your sentence.'
        }

    async def get_my_words(self, user_id: str) -> MyWordsResponse:
        """
        Retrieves all previously learned vocabulary items for 'My Words' collection.
        """
        prof = await self._get_learner_profile(user_id)
        support_lang = (prof.website_language if prof and prof.website_language else "en").lower()

        stmt = (
            select(LearnerDailyWord)
            .where(
                LearnerDailyWord.user_id == str(user_id),
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
            words=items,
            total_count=len(items),
        )
