import logging
from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.learning import LearningModule, Lesson, LessonProgress, ModuleProgress
from app.models.assessment import AssessmentResult
from app.schemas.learning import LessonProgressUpdate

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
        
    async def get_lesson(self, lesson_id: str) -> Optional[Lesson]:
        """Fetch a lesson by ID."""
        result = await self.db.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        return result.scalars().first()

    async def update_lesson_progress(self, user_id: UUID, lesson_id: str, update_data: LessonProgressUpdate) -> LessonProgress:
        """Update or create a lesson progress record."""
        # Validate lesson exists
        lesson = await self.get_lesson(lesson_id)
        if not lesson:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
            
        result = await self.db.execute(
            select(LessonProgress).where(
                and_(LessonProgress.user_id == user_id, LessonProgress.lesson_id == lesson_id)
            )
        )
        progress = result.scalars().first()

        now = datetime.utcnow()
        if not progress:
            progress = LessonProgress(
                user_id=user_id,
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
            progress.time_spent_seconds += update_data.time_spent_seconds

        if progress.status == "completed" and not progress.completed_at:
            progress.completed_at = update_data.completed_at or now
            progress.progress_percentage = 100.0

        await self.db.commit()
        await self.db.refresh(progress)

        # Trigger module progress recalculation on completion
        if progress.status == "completed":
            await self._recalculate_module_progress(user_id, lesson.module_id)

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

        lesson_ids = [l.id for l in module_lessons]
        prog_result = await self.db.execute(
            select(LessonProgress).where(
                and_(LessonProgress.user_id == user_id, LessonProgress.lesson_id.in_(lesson_ids), LessonProgress.status == "completed")
            )
        )
        completed_lessons = prog_result.scalars().all()
        completed_count = len(completed_lessons)

        mod_prog_result = await self.db.execute(
            select(ModuleProgress).where(
                and_(ModuleProgress.user_id == user_id, ModuleProgress.module_id == module_id)
            )
        )
        mod_prog = mod_prog_result.scalars().first()

        if not mod_prog:
            mod_prog = ModuleProgress(
                user_id=user_id,
                module_id=module_id
            )
            self.db.add(mod_prog)

        mod_prog.completed_lessons_count = completed_count
        mod_prog.progress_percentage = (completed_count / total_lessons) * 100.0
        
        if completed_count == total_lessons and not mod_prog.is_completed:
            mod_prog.is_completed = True
            mod_prog.completed_at = datetime.utcnow()
            
        await self.db.commit()

    async def get_recommended_lesson(self, user_id: UUID) -> Optional[Lesson]:
        """
        The core recommendation logic enforcing the 1-2-3 prioritized sequence.
        1. Return any active `in_progress` lesson.
        2. Read AssessmentResult learning path -> highest-priority incomplete module lesson.
        3. Fallback to revision.
        """
        # 1. Check for Active In-Progress Lesson
        in_prog_result = await self.db.execute(
            select(LessonProgress).where(
                and_(LessonProgress.user_id == user_id, LessonProgress.status == "in_progress")
            ).order_by(LessonProgress.last_accessed_at.desc())
        )
        active_progress = in_prog_result.scalars().first()
        if active_progress:
            return await self.get_lesson(active_progress.lesson_id)

        # 2. Iterate up the personalized learning_path
        assessment_result = await self.db.execute(
            select(AssessmentResult).where(AssessmentResult.learner_id == str(user_id)).order_by(AssessmentResult.created_at.desc())
        )
        latest_assessment = assessment_result.scalars().first()

        if latest_assessment and latest_assessment.learning_path:
            import json
            # Ensure learning_path is actually parsed as a list of dicts
            path_list = latest_assessment.learning_path
            if isinstance(path_list, str):
                try:
                    path_list = json.loads(path_list)
                except Exception:
                    path_list = []
                    
            if not isinstance(path_list, list):
                path_list = []

            # Sort the learning path by priority ascending
            sorted_path = sorted(path_list, key=lambda x: x.get("priority", 999) if isinstance(x, dict) else 999)
            
            for path_item in sorted_path:
                if not isinstance(path_item, dict):
                    continue
                mod_id = path_item.get("module_id")
                if not mod_id:
                    continue
                    
                # Check module progress
                mod_prog_result = await self.db.execute(select(ModuleProgress).where(and_(ModuleProgress.user_id == user_id, ModuleProgress.module_id == mod_id)))
                mod_prog = mod_prog_result.scalars().first()
                if mod_prog and mod_prog.is_completed:
                    continue # Module mastered, continue down path
                    
                # Module is not complete, find the earliest uncompleted lesson sequence
                module = await self.get_module_with_lessons(mod_id)
                if not module or not module.lessons:
                    continue
                    
                lesson_ids = [l.id for l in module.lessons]
                prog_result = await self.db.execute(
                    select(LessonProgress).where(
                        and_(LessonProgress.user_id == user_id, LessonProgress.lesson_id.in_(lesson_ids))
                    )
                )
                progress_dict = {p.lesson_id: p for p in prog_result.scalars().all()}
                
                for lesson in module.lessons:
                    less_prog = progress_dict.get(lesson.id)
                    if not less_prog or less_prog.status != "completed":
                        return lesson

        # 3. Fallback (Future enhancement for revision path)
        # Instead, just sequentially find the first incomplete lesson in all active modules mathematically. 
        all_modules = await self.get_modules()
        for module in all_modules:
            mod_prog_result = await self.db.execute(select(ModuleProgress).where(and_(ModuleProgress.user_id == user_id, ModuleProgress.module_id == module.id)))
            mod_prog = mod_prog_result.scalars().first()
            if mod_prog and mod_prog.is_completed:
                continue
            
            mod_with_less = await self.get_module_with_lessons(module.id)
            if not mod_with_less or not mod_with_less.lessons:
                continue
            
            lesson_ids = [l.id for l in mod_with_less.lessons]
            prog_result = await self.db.execute(
                select(LessonProgress).where(
                    and_(LessonProgress.user_id == user_id, LessonProgress.lesson_id.in_(lesson_ids))
                )
            )
            progress_dict = {p.lesson_id: p for p in prog_result.scalars().all()}
            
            for lesson in mod_with_less.lessons:
                less_prog = progress_dict.get(lesson.id)
                if not less_prog or less_prog.status != "completed":
                    return lesson

        return None
