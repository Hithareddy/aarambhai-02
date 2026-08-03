import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.learning import LearningModule, Lesson, LessonProgress, ModuleProgress
from app.models.learner import LearnerProfile
from app.models.assessment import AssessmentResult
from app.models.skill_profile import SkillProfile
from app.schemas.learning import LessonProgressUpdate, RecommendedLessonResponse, RecommendationReason

logger = logging.getLogger(__name__)

class LearningService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_modules(self) -> List[LearningModule]:
        """Fetch all active learning modules ordered by sequence."""
        result = await self.db.execute(
            select(LearningModule).where(LearningModule.is_active == True).order_by(LearningModule.order)
        )
        return result.scalars().all()

    async def get_module_with_lessons(self, module_id: str) -> Optional[LearningModule]:
        """Fetch a specific module with all its lessons included."""
        result = await self.db.execute(
            select(LearningModule)
            .options(selectinload(LearningModule.lessons))
            .where(LearningModule.id == module_id, LearningModule.is_active == True)
        )
        return result.scalars().first()
        
    async def get_lesson(self, lesson_id: str, user_id: Optional[str] = None) -> Optional[Lesson]:
        """Fetch a lesson by ID and ensure rich 13-section interactive content blocks exist."""
        result = await self.db.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        lesson = result.scalars().first()
        if not lesson:
            return None

        # Check if lesson content_blocks need full 13-section enrichment
        if not lesson.content_blocks or len(lesson.content_blocks) < 5:
            # Fetch user profile to get learning & website languages
            learning_lang = "en"
            website_lang = "en"
            age_grp = "25-34"
            if user_id:
                prof_res = await self.db.execute(select(LearnerProfile).where(LearnerProfile.user_id == str(user_id)))
                prof = prof_res.scalars().first()
                if prof:
                    learning_lang = prof.learning_language or "en"
                    website_lang = prof.website_language or "en"
                    age_grp = prof.age_group or "25-34"

            # Determine skill from parent module
            skill = "general"
            if lesson.module_id:
                mod_res = await self.db.execute(select(LearningModule).where(LearningModule.id == lesson.module_id))
                mod = mod_res.scalars().first()
                if mod and mod.skill:
                    skill = mod.skill

            from app.services.lesson_content_builder import build_interactive_lesson_content
            lesson.content_blocks = build_interactive_lesson_content(
                lesson_id=lesson.id,
                title=lesson.title,
                skill=skill,
                learning_language=learning_lang,
                website_language=website_lang,
                age_group=age_grp
            )

        return lesson

    async def update_lesson_progress(self, user_id: UUID, lesson_id: str, update_data: LessonProgressUpdate) -> LessonProgress:
        """Update or create a lesson progress record."""
        # Validate lesson exists
        lesson = await self.get_lesson(lesson_id)
        if not lesson:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
            
        import uuid
        user_id_str = str(user_id)
        result = await self.db.execute(
            select(LessonProgress).where(
                and_(LessonProgress.user_id == user_id_str, LessonProgress.lesson_id == lesson_id)
            )
        )
        progress = result.scalars().first()

        now = datetime.utcnow()
        if not progress:
            progress = LessonProgress(
                id=str(uuid.uuid4()),
                user_id=user_id_str,
                lesson_id=lesson_id,
                started_at=now,
                last_accessed_at=now,
            )
            self.db.add(progress)
        else:
            progress.last_accessed_at = now

        if update_data.status:
            progress.status = update_data.status
        if update_data.progress_percentage is not None:
            progress.progress_percentage = update_data.progress_percentage
        if update_data.score is not None:
            progress.score = update_data.score
        if update_data.time_spent_seconds is not None:
            progress.time_spent_seconds = (progress.time_spent_seconds or 0) + update_data.time_spent_seconds

        if progress.status == "completed" and not progress.completed_at:
            progress.completed_at = update_data.completed_at or now
            progress.progress_percentage = 100.0

        await self.db.commit()
        await self.db.refresh(progress)

        # Sprint 10 Adaptive Modification
        await self._update_skill_profiling(str(user_id), lesson, update_data)

        # Trigger module progress recalculation and award XP on completion
        if progress.status == "completed":
            await self._recalculate_module_progress(user_id, lesson.module_id)
            from app.services.gamification_service import GamificationService
            await GamificationService(self.db).award_xp(
                str(user_id), 25, activity_type="lesson", metadata={"score": update_data.score or 100}
            )

        return progress

    async def _recalculate_module_progress(self, user_id: UUID, module_id: str) -> None:
        """Internal recalculation logic to track parent Module completion rates."""
        result = await self.db.execute(
            select(Lesson).where(Lesson.module_id == module_id)
        )
        module_lessons = result.scalars().all()
        total_lessons = len(module_lessons)
        if total_lessons == 0:
            return

        user_id_str = str(user_id)
        lesson_ids = [l.id for l in module_lessons]
        prog_result = await self.db.execute(
            select(LessonProgress).where(
                and_(LessonProgress.user_id == user_id_str, LessonProgress.lesson_id.in_(lesson_ids), LessonProgress.status == "completed")
            )
        )
        completed_lessons = prog_result.scalars().all()
        completed_count = len(completed_lessons)

        mod_prog_result = await self.db.execute(
            select(ModuleProgress).where(
                and_(ModuleProgress.user_id == user_id_str, ModuleProgress.module_id == module_id)
            )
        )
        mod_prog = mod_prog_result.scalars().first()

        if not mod_prog:
            import uuid
            mod_prog = ModuleProgress(
                id=str(uuid.uuid4()),
                user_id=user_id_str,
                module_id=module_id
            )
            self.db.add(mod_prog)

        mod_prog.completed_lessons_count = completed_count
        mod_prog.progress_percentage = (completed_count / total_lessons) * 100.0
        
        if completed_count == total_lessons and not mod_prog.is_completed:
            mod_prog.is_completed = True
            mod_prog.completed_at = datetime.utcnow()
            
        await self.db.commit()

    async def _update_skill_profiling(self, user_id: str, lesson: Lesson, update_data: LessonProgressUpdate) -> None:
        """Weighting algorithm parsing signals (accuracy, hints) mutating the active SkillProfile mapping."""
        # Only process if we have measurable signals
        if update_data.quiz_accuracy is None and update_data.pronunciation_score is None and update_data.hints_used is None:
            if update_data.status != "completed":
                return
        
        # Skill derives from the module parent via async query
        mod_res = await self.db.execute(select(LearningModule).where(LearningModule.id == lesson.module_id))
        mod_obj = mod_res.scalars().first()
        skill = mod_obj.skill if mod_obj else None
        if not skill: return

        # Load or create profile
        profile_res = await self.db.execute(select(SkillProfile).where(and_(SkillProfile.user_id == user_id, SkillProfile.skill == skill)))
        profile = profile_res.scalars().first()
        if not profile:
            profile = SkillProfile(user_id=user_id, skill=skill, mastery_percentage=20.0, confidence_score=20.0)
            self.db.add(profile)

        # Basic weighted heuristic modifications
        base_modifier = 0.0
        if update_data.quiz_accuracy is not None:
             base_modifier += (update_data.quiz_accuracy - 70.0) * 0.1 # +/- delta based on 70% threshold
        if update_data.pronunciation_score is not None:
             base_modifier += (update_data.pronunciation_score - 70.0) * 0.15 # Higher weight for vocal acts
             
        # Hint usage decreases confidence slightly
        hints = update_data.hints_used or 0
        if hints > 0:
             profile.confidence_score = max(0.0, profile.confidence_score - (hints * 2.0))
        elif update_data.status == "completed" and hints == 0:
             profile.confidence_score = min(100.0, profile.confidence_score + 5.0)

        # Baseline completion bump
        if update_data.status == "completed":
            base_modifier += 4.0

        profile.mastery_percentage = max(0.0, min(100.0, profile.mastery_percentage + base_modifier))
        await self.db.commit()

    async def get_recommended_lesson(self, user_id: UUID) -> Optional[dict]:
        """
        Adaptive Recommendation Engine (Sprint 10 & 10.1)
        Evaluates current performance, spaced repetitions, and adaptive profiles to derive next steps.
        Returns a dict: {"lesson": <Lesson>, "reason": <RecommendationReason>}
        """
        
        # 1. Check for Active In-Progress Lesson
        in_prog_result = await self.db.execute(
            select(LessonProgress).where(
                and_(LessonProgress.user_id == str(user_id), LessonProgress.status == "in_progress")
            ).order_by(LessonProgress.last_accessed_at.desc())
        )
        active_progress = in_prog_result.scalars().first()
        if active_progress:
            lesson = await self.get_lesson(active_progress.lesson_id)
            if lesson:
                return {
                    "lesson": lesson, 
                    "reason": RecommendationReason(
                        type="resume", skill=lesson.module.skill if lesson.module else "general", 
                        message="This lesson is already in progress. Let's pick up right where you left off!"
                    ).model_dump()
                }

        # Query all Skill Profiles for adaptive routing
        skills_result = await self.db.execute(
            select(SkillProfile).where(SkillProfile.user_id == str(user_id))
        )
        skill_profiles = skills_result.scalars().all()
        
        # 2. Check for Weak Skill Recovery (Reinforcement)
        # If any skill is explicitly flagging low confidence or mastery (e.g. dropped heavily during practice)
        weak_profiles = [p for p in skill_profiles if p.mastery_percentage < 40.0 and p.mastery_percentage > 0.0]
        if weak_profiles:
            # Pick the weakest skill
            weakest = sorted(weak_profiles, key=lambda x: x.mastery_percentage)[0]
            # Find an incomplete lesson in this skill
            fallback_lesson = await self._find_incomplete_lesson_by_skill(str(user_id), weakest.skill)
            if fallback_lesson:
                return {
                    "lesson": fallback_lesson,
                    "reason": RecommendationReason(
                        type="reinforcement", skill=weakest.skill,
                        message=f"We're recommending this because your {weakest.skill.lower()} practice showed you would benefit from some extra reinforcement."
                    ).model_dump()
                }

        # 3. Spaced Revision (SRS Algorithm)
        # Find lessons completed more than 3 days ago but haven't been revised
        three_days_ago = datetime.utcnow() - timedelta(days=3)
        revision_result = await self.db.execute(
            select(LessonProgress).where(
                and_(LessonProgress.user_id == str(user_id), LessonProgress.status == "completed", LessonProgress.completed_at < three_days_ago)
            ).order_by(LessonProgress.completed_at.asc())
        )
        revision_prog = revision_result.scalars().first()
        if revision_prog:
            # We recommend this for revision
            rev_lesson = await self.get_lesson(revision_prog.lesson_id)
            if rev_lesson:
                return {
                    "lesson": rev_lesson,
                    "reason": RecommendationReason(
                        type="revision", skill=rev_lesson.module.skill if rev_lesson.module else "general",
                        message="It's been a few days since you learned this. Let's review it to keep it fresh in your memory!"
                    ).model_dump()
                }

        # 4. Continue Personalized Learning Path Sequence
        assessment_result = await self.db.execute(
            select(AssessmentResult).where(AssessmentResult.learner_id == str(user_id)).order_by(AssessmentResult.created_at.desc())
        )
        latest_assessment = assessment_result.scalars().first()

        if latest_assessment and latest_assessment.learning_path:
            import json
            path_list = latest_assessment.learning_path
            if isinstance(path_list, str):
                try: path_list = json.loads(path_list)
                except Exception: path_list = []
            if not isinstance(path_list, list): path_list = []

            sorted_path = sorted(path_list, key=lambda x: x.get("priority", 999) if isinstance(x, dict) else 999)
            
            for path_item in sorted_path:
                if not isinstance(path_item, dict): continue
                mod_id = path_item.get("module_id")
                if not mod_id: continue
                    
                mod_prog_result = await self.db.execute(select(ModuleProgress).where(and_(ModuleProgress.user_id == str(user_id), ModuleProgress.module_id == mod_id)))
                mod_prog = mod_prog_result.scalars().first()
                if mod_prog and mod_prog.is_completed:
                    continue # Module mastered
                    
                module = await self.get_module_with_lessons(mod_id)
                if not module or not module.lessons: continue
                    
                lesson_ids = [l.id for l in module.lessons]
                prog_result = await self.db.execute(
                    select(LessonProgress).where(and_(LessonProgress.user_id == str(user_id), LessonProgress.lesson_id.in_(lesson_ids)))
                )
                progress_dict = {p.lesson_id: p for p in prog_result.scalars().all()}
                
                for lesson in module.lessons:
                    less_prog = progress_dict.get(lesson.id)
                    if not less_prog or less_prog.status != "completed":
                        # Recommend this active block
                        # Is it because they have high mastery unlocking things, or just regular sequence?
                        return {
                            "lesson": lesson,
                            "reason": RecommendationReason(
                                type="next_in_sequence", skill=module.skill,
                                message=f"Recommended as the perfect next step in your personalized learning journey!"
                            ).model_dump()
                        }

        # 5. Global Fallback
        all_modules = await self.get_modules()
        for module in all_modules:
            lesson = await self._find_first_incomplete_in_module(str(user_id), module)
            if lesson:
                return {
                    "lesson": lesson,
                    "reason": RecommendationReason(
                        type="fallback", skill=module.skill,
                        message="Explore this new foundational topic to expand your broader linguistic skills."
                    ).model_dump()
                }

        return None

    async def _find_incomplete_lesson_by_skill(self, user_id: str, skill: str) -> Optional[Lesson]:
        """Helper routing to find an available remediation lesson scoped to a skill"""
        mod_result = await self.db.execute(select(LearningModule).where(LearningModule.skill == skill).order_by(LearningModule.order))
        modules = mod_result.scalars().all()
        for module in modules:
            lesson = await self._find_first_incomplete_in_module(user_id, module, is_remediation=True)
            if lesson: return lesson
        return None

    async def _find_first_incomplete_in_module(self, user_id: str, module: LearningModule, is_remediation: bool = False) -> Optional[Lesson]:
        """Helper checking completion status in a module. Bypasses rudimentary lessons if mastery is globally high."""
        mod_prog_result = await self.db.execute(select(ModuleProgress).where(and_(ModuleProgress.user_id == user_id, ModuleProgress.module_id == module.id)))
        mod_prog = mod_prog_result.scalars().first()
        if mod_prog and mod_prog.is_completed: return None
        
        mod_with_less = await self.get_module_with_lessons(module.id)
        if not mod_with_less or not mod_with_less.lessons: return None
        
        lesson_ids = [l.id for l in mod_with_less.lessons]
        prog_result = await self.db.execute(select(LessonProgress).where(and_(LessonProgress.user_id == user_id, LessonProgress.lesson_id.in_(lesson_ids))))
        progress_dict = {p.lesson_id: p for p in prog_result.scalars().all()}
        
        # Sprint 10 Phase 4 Adaptive Skips
        profile_res = await self.db.execute(select(SkillProfile).where(and_(SkillProfile.user_id == user_id, SkillProfile.skill == module.skill)))
        profile = profile_res.scalars().first()
        mastery = profile.mastery_percentage if profile else 0.0
        
        for lesson in mod_with_less.lessons:
            less_prog = progress_dict.get(lesson.id)
            if not less_prog or less_prog.status != "completed":
                # Sprint 10.5 Guardrail: Validate lesson structural integrity before yielding
                from app.services.validation_service import ValidationService
                issues = ValidationService(self.db)._inspect_blocks(lesson)
                if issues["errors"]:
                    logger.warning(f"Skipping lesson {lesson.id} due to validation errors: {issues['errors']}")
                    continue

                # Difficulty bypass logic
                if mastery > 85.0 and not is_remediation:
                    # Skip basic practice if they are super high mastery, unless it's a dedicated quiz
                    if lesson.lesson_type == "practice":
                        continue
                return lesson
        return None
