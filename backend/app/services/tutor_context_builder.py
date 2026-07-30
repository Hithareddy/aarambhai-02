import json
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.learner import LearnerProfile
from app.models.assessment import AssessmentResult
from app.models.skill_profile import SkillProfile
from app.models.vocabulary import LearnerDailyWord, VocabularyWord
from app.models.learning import LessonProgress, LearningModule, Lesson

logger = logging.getLogger(__name__)


@dataclass
class LearnerTutorContext:
    learner_name: str
    learning_language: str
    website_language: str
    proficiency_level: str
    learning_goal: str
    weakest_skill: Optional[str] = None
    strongest_skill: Optional[str] = None
    recent_words: List[Dict[str, str]] = field(default_factory=list) # [{"word": "...", "meaning": "...", "example": "..."}]
    current_focus: Optional[str] = None # Title or concept of current learning module/lesson


class TutorContextBuilder:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def build_context(self, user_id: str) -> LearnerTutorContext:
        """
        Safely fetch and assemble compact, structured context for a specific learner.
        All queries are scoped strictly to authenticated user_id.
        """
        # 1. Learner Profile
        res_prof = await self.db.execute(
            select(LearnerProfile).where(LearnerProfile.user_id == user_id)
        )
        profile = res_prof.scalar_one_or_none()
        if not profile:
            raise ValueError(f"Learner profile not found for user_id={user_id}")

        learner_name = profile.name or "Learner"
        learning_language = profile.learning_language or "en"
        website_language = profile.website_language or "te"
        proficiency_level = profile.current_familiarity or "Beginner"
        learning_goal = profile.learning_goal or "General Practice"

        # 2. Skill Profiles (LSRW Weaknesses / Strengths)
        res_skills = await self.db.execute(
            select(SkillProfile)
            .where(SkillProfile.user_id == user_id)
            .order_by(SkillProfile.mastery_percentage.asc())
        )
        skill_profiles = list(res_skills.scalars().all())

        weakest_skill = None
        strongest_skill = None

        if skill_profiles:
            weakest_skill = skill_profiles[0].skill
            strongest_skill = skill_profiles[-1].skill
        else:
            # Fallback to AssessmentResult weaknesses if dynamic skill profile is empty
            res_assess = await self.db.execute(
                select(AssessmentResult)
                .where(AssessmentResult.learner_id == user_id)
                .order_by(AssessmentResult.created_at.desc())
                .limit(1)
            )
            assess_result = res_assess.scalar_one_or_none()
            if assess_result:
                try:
                    weaknesses = json.loads(assess_result.weaknesses) if isinstance(assess_result.weaknesses, str) else assess_result.weaknesses
                    if weaknesses and isinstance(weaknesses, list) and len(weaknesses) > 0:
                        weakest_skill = str(weaknesses[0])
                except Exception as e:
                    logger.warning(f"Could not parse weaknesses JSON: {e}")

        # Default fallback if skills still unset
        if not weakest_skill:
            weakest_skill = "speaking"

        # 3. Recent Learned Vocabulary (My Words)
        res_words = await self.db.execute(
            select(LearnerDailyWord, VocabularyWord)
            .join(VocabularyWord, LearnerDailyWord.word_id == VocabularyWord.id)
            .where(LearnerDailyWord.user_id == user_id)
            .where(LearnerDailyWord.is_completed == True)
            .order_by(LearnerDailyWord.completed_at.desc())
            .limit(3)
        )
        word_rows = res_words.all()
        recent_words = []
        for daily_rec, vocab_rec in word_rows:
            # Support language translation if available
            meaning_supp = vocab_rec.meaning_en
            if vocab_rec.meanings_json and isinstance(vocab_rec.meanings_json, dict):
                meaning_supp = vocab_rec.meanings_json.get(website_language, vocab_rec.meaning_en)

            recent_words.append({
                "word": vocab_rec.word,
                "meaning": meaning_supp,
                "example": vocab_rec.example_sentence,
            })

        # 4. Current Focus / Learning Path Module
        res_assess = await self.db.execute(
            select(AssessmentResult)
            .where(AssessmentResult.learner_id == user_id)
            .order_by(AssessmentResult.created_at.desc())
            .limit(1)
        )
        assess_result = res_assess.scalar_one_or_none()

        current_focus = None
        if assess_result and assess_result.learning_path:
            try:
                lpath = json.loads(assess_result.learning_path) if isinstance(assess_result.learning_path, str) else assess_result.learning_path
                if isinstance(lpath, list) and len(lpath) > 0:
                    first_item = lpath[0]
                    if isinstance(first_item, dict):
                        current_focus = first_item.get("title") or first_item.get("skill")
            except Exception as e:
                logger.warning(f"Could not parse learning_path JSON: {e}")

        if not current_focus:
            # Check LessonProgress for recent active lesson
            res_lp = await self.db.execute(
                select(LessonProgress, Lesson)
                .join(Lesson, LessonProgress.lesson_id == Lesson.id)
                .where(LessonProgress.user_id == user_id)
                .order_by(LessonProgress.updated_at.desc())
                .limit(1)
            )
            lp_row = res_lp.first()
            if lp_row:
                _, lesson_rec = lp_row
                current_focus = lesson_rec.title

        if not current_focus:
            current_focus = f"Basic {weakest_skill.capitalize()} & Daily Vocabulary"

        return LearnerTutorContext(
            learner_name=learner_name,
            learning_language=learning_language,
            website_language=website_language,
            proficiency_level=proficiency_level,
            learning_goal=learning_goal,
            weakest_skill=weakest_skill,
            strongest_skill=strongest_skill,
            recent_words=recent_words,
            current_focus=current_focus,
        )
