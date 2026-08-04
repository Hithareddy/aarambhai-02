"""
Journey Service.

Builds the full, milestone-based Learning Path payload consumed by the
learner-facing roadmap screen. It aggregates modules, lessons, per-lesson
progress, module progress, skill mastery, XP and the adaptive "next step"
recommendation into a single response so the UI stays consistent with every
other surface of the platform.
"""
import json
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.assessment import AssessmentResult
from app.models.learner import LearnerProfile
from app.models.learning import Lesson, LearningModule, LessonProgress, ModuleProgress
from app.models.skill_profile import SkillProfile

logger = logging.getLogger(__name__)

XP_PER_LESSON = 25


class JourneyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def build(self, user_id: str) -> Dict[str, Any]:
        user_id = str(user_id)

        modules = await self._modules()
        lesson_progress = await self._lesson_progress(user_id)
        module_progress = await self._module_progress(user_id)
        skill_profiles = await self._skill_profiles(user_id)
        path_meta = await self._assessment_path(user_id)
        profile = await self._learner_profile(user_id)

        ordered = self._order_modules(modules, path_meta)

        milestones: List[Dict[str, Any]] = []
        current_assigned = False
        previous_completed = True

        total_lessons = 0
        completed_lessons = 0
        remaining_minutes = 0

        for index, module in enumerate(ordered):
            lessons = sorted(module.lessons or [], key=lambda l: l.order or 0)
            lesson_items: List[Dict[str, Any]] = []
            module_completed_count = 0

            for lesson in lessons:
                prog = lesson_progress.get(lesson.id)
                status = prog.status if prog else "not_started"
                if status == "completed":
                    module_completed_count += 1
                lesson_items.append(
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "lesson_type": lesson.lesson_type or "learning",
                        "order": lesson.order or 0,
                        "status": status,
                        "progress_percentage": float(prog.progress_percentage or 0.0) if prog else 0.0,
                        "score": float(prog.score) if prog and prog.score is not None else None,
                        "xp_reward": XP_PER_LESSON,
                    }
                )

            lesson_count = len(lesson_items)
            total_lessons += lesson_count
            completed_lessons += module_completed_count

            mod_prog = module_progress.get(module.id)
            is_module_completed = bool(
                (mod_prog and mod_prog.is_completed)
                or (lesson_count > 0 and module_completed_count == lesson_count)
            )
            percentage = (
                100.0
                if is_module_completed
                else round((module_completed_count / lesson_count) * 100.0, 1)
                if lesson_count
                else 0.0
            )

            if is_module_completed:
                state = "completed"
            elif not current_assigned and previous_completed:
                state = "current"
                current_assigned = True
            elif not current_assigned:
                state = "current"
                current_assigned = True
            elif previous_completed or index == 0:
                state = "available"
            else:
                state = "locked"

            # Prerequisites always win: an unmet prerequisite keeps a module locked.
            prereqs = module.prerequisites if isinstance(module.prerequisites, list) else []
            unmet = [
                p
                for p in prereqs
                if not (module_progress.get(p) and module_progress[p].is_completed)
            ]
            if unmet and state not in ("completed", "current"):
                state = "locked"

            if state != "completed":
                remaining_minutes += int(module.estimated_duration or 15)

            meta = path_meta.get(module.id, {})
            next_lesson = next(
                (l for l in lesson_items if l["status"] != "completed"), None
            )

            milestones.append(
                {
                    "id": module.id,
                    "title": module.title,
                    "description": module.description
                    or "Build confidence with focused, real-life practice in this milestone.",
                    "skill": module.skill,
                    "difficulty": int(module.difficulty or 1),
                    "estimated_duration": int(module.estimated_duration or 15),
                    "order": index + 1,
                    "state": state,
                    "progress_percentage": percentage,
                    "completed_lessons": module_completed_count,
                    "total_lessons": lesson_count,
                    "xp_total": lesson_count * XP_PER_LESSON,
                    "xp_earned": module_completed_count * XP_PER_LESSON,
                    "prerequisites": prereqs,
                    "unmet_prerequisites": unmet,
                    "recommendation_reason": meta.get("reason"),
                    "priority": meta.get("priority"),
                    "lessons": lesson_items,
                    "next_lesson_id": next_lesson["id"] if next_lesson else None,
                }
            )
            previous_completed = is_module_completed

        current = next((m for m in milestones if m["state"] == "current"), None)
        overall = (
            round((completed_lessons / total_lessons) * 100.0, 1) if total_lessons else 0.0
        )

        daily_minutes = int(getattr(profile, "daily_goal_minutes", 20) or 20)
        days_remaining = max(1, round(remaining_minutes / max(daily_minutes, 1)))

        return {
            "has_path": bool(milestones),
            "learner_name": getattr(profile, "name", None),
            "learning_goal": getattr(profile, "learning_goal", None),
            "learning_language": getattr(profile, "learning_language", None),
            "overall_percentage": overall,
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "modules_completed": len([m for m in milestones if m["state"] == "completed"]),
            "modules_total": len(milestones),
            "xp_earned": completed_lessons * XP_PER_LESSON,
            "xp_available": total_lessons * XP_PER_LESSON,
            "estimated_minutes_remaining": remaining_minutes,
            "estimated_days_remaining": days_remaining,
            "daily_goal_minutes": daily_minutes,
            "current_module_id": current["id"] if current else None,
            "next_lesson_id": current["next_lesson_id"] if current else None,
            "skill_profiles": [
                {
                    "skill": p.skill,
                    "current_level": int(p.current_level or 1),
                    "mastery_percentage": round(float(p.mastery_percentage or 0.0), 1),
                    "confidence_score": round(float(p.confidence_score or 0.0), 1),
                }
                for p in skill_profiles
            ],
            "recommendations": self._recommendations(skill_profiles, current, overall),
            "milestones": milestones,
        }

    # --- internals -------------------------------------------------------

    async def _modules(self) -> List[LearningModule]:
        result = await self.db.execute(
            select(LearningModule)
            .options(selectinload(LearningModule.lessons))
            .where(LearningModule.is_active == True)  # noqa: E712
            .order_by(LearningModule.order)
        )
        return list(result.scalars().unique().all())

    async def _lesson_progress(self, user_id: str) -> Dict[str, LessonProgress]:
        result = await self.db.execute(
            select(LessonProgress).where(LessonProgress.user_id == user_id)
        )
        return {p.lesson_id: p for p in result.scalars().all()}

    async def _module_progress(self, user_id: str) -> Dict[str, ModuleProgress]:
        result = await self.db.execute(
            select(ModuleProgress).where(ModuleProgress.user_id == user_id)
        )
        return {p.module_id: p for p in result.scalars().all()}

    async def _skill_profiles(self, user_id: str) -> List[SkillProfile]:
        result = await self.db.execute(
            select(SkillProfile).where(SkillProfile.user_id == user_id)
        )
        return list(result.scalars().all())

    async def _learner_profile(self, user_id: str) -> Optional[LearnerProfile]:
        result = await self.db.execute(
            select(LearnerProfile).where(LearnerProfile.user_id == user_id)
        )
        return result.scalars().first()

    async def _assessment_path(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """Map module_id -> {priority, reason} taken from the latest assessment."""
        result = await self.db.execute(
            select(AssessmentResult)
            .where(AssessmentResult.learner_id == user_id)
            .order_by(AssessmentResult.created_at.desc())
        )
        latest = result.scalars().first()
        if not latest or not latest.learning_path:
            return {}

        path = latest.learning_path
        if isinstance(path, str):
            try:
                path = json.loads(path)
            except Exception:
                return {}
        if not isinstance(path, list):
            return {}

        mapping: Dict[str, Dict[str, Any]] = {}
        for item in path:
            if not isinstance(item, dict):
                continue
            module_id = item.get("module_id")
            if not module_id:
                continue
            mapping[module_id] = {
                "priority": item.get("priority", 999),
                "reason": item.get("reason")
                or item.get("rationale")
                or "Recommended from your placement assessment results.",
            }
        return mapping

    def _order_modules(
        self, modules: List[LearningModule], path_meta: Dict[str, Dict[str, Any]]
    ) -> List[LearningModule]:
        if not path_meta:
            return modules

        def sort_key(module: LearningModule):
            meta = path_meta.get(module.id)
            if meta:
                return (0, meta.get("priority", 999), module.order or 0)
            return (1, module.order or 0, 0)

        return sorted(modules, key=sort_key)

    def _recommendations(
        self,
        skill_profiles: List[SkillProfile],
        current: Optional[Dict[str, Any]],
        overall: float,
    ) -> List[Dict[str, str]]:
        recs: List[Dict[str, str]] = []

        if current:
            recs.append(
                {
                    "type": "next_step",
                    "title": f"Continue “{current['title']}”",
                    "message": current.get("recommendation_reason")
                    or "This is the next milestone on your personalised path.",
                    "action": "lesson",
                    "target": current.get("next_lesson_id") or "",
                }
            )

        weak = sorted(
            [p for p in skill_profiles if (p.mastery_percentage or 0) < 50],
            key=lambda p: p.mastery_percentage or 0,
        )
        if weak:
            skill = weak[0].skill
            recs.append(
                {
                    "type": "reinforce",
                    "title": f"Strengthen your {skill.lower()}",
                    "message": f"Your {skill.lower()} mastery is at {round(weak[0].mastery_percentage or 0)}%. A short practice session will lift it quickly.",
                    "action": "practice",
                    "target": skill,
                }
            )

        if overall >= 60:
            recs.append(
                {
                    "type": "celebrate",
                    "title": "You're past the halfway mark",
                    "message": "Keep your streak alive — a game or quick practice round counts towards today's goal.",
                    "action": "games",
                    "target": "",
                }
            )
        else:
            recs.append(
                {
                    "type": "tutor",
                    "title": "Stuck on something?",
                    "message": "Ask your AI Tutor to explain any lesson in your own language, step by step.",
                    "action": "tutor",
                    "target": "",
                }
            )
        return recs
