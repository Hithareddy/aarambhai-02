import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.learning import LearningModule, Lesson, LearningActivity, ActivitySession, ActivityAnalytics
from app.models.assessment import AssessmentResult
from app.models.skill_profile import SkillProfile
from app.schemas.practice import TodaysLearningResponse, UnifiedActivityResponse, ActivityMetadata

logger = logging.getLogger(__name__)

class PracticeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_todays_learning_plan(self, user_id: UUID) -> TodaysLearningResponse:
        """
        Implements the Unified Learning Content Engine Recommendation Algorithm.
        Evaluates signals:
        - AssessmentResult
        - Skill Masteries
        - Spaced Revision Requirements (completed activities > 3 days ago with low accuracy)
        """
        # 1. Gather Signals
        # -----------------
        # Latest Assessment
        assessment_res = await self.db.execute(
            select(AssessmentResult).where(AssessmentResult.learner_id == str(user_id)).order_by(AssessmentResult.created_at.desc())
        )
        latest_assessment = assessment_res.scalars().first()

        # Skill Profiles
        skills_res = await self.db.execute(
            select(SkillProfile).where(SkillProfile.user_id == str(user_id))
        )
        skill_profiles = {p.skill: p for p in skills_res.scalars().all()}
        
        # Learner Profile (Demographics & Persona constraints)
        from app.models.learner import LearnerProfile
        profile_res = await self.db.execute(select(LearnerProfile).where(LearnerProfile.user_id == str(user_id)))
        learner = profile_res.scalars().first()
        is_senior = learner is not None and getattr(learner, "role", "") == "senior_citizen"
        activity_cap = 2 if is_senior else 4
        
        # 2. Build Pipeline
        # -----------------
        planned_activities = []
        total_xp_pool = 0
        total_time_seconds = 0
        context_title = "Daily Practice"

        # Determine target module - simplified routing: take the highest priority from Learning Path fallback
        # If leaning path exists, map to a module. Otherwise default to a base module.
        target_module_id = None
        if latest_assessment and latest_assessment.learning_path:
            import json
            paths = latest_assessment.learning_path
            if isinstance(paths, str):
                try: paths = json.loads(paths)
                except Exception: paths = []
            if isinstance(paths, list) and len(paths) > 0:
                # Naive sort by priority and pick first incomplete
                # (Assumes learning_service handles deep module progress gating, here we just select a likely target)
                target = sorted(paths, key=lambda x: x.get("priority", 999) if isinstance(x, dict) else 999)[0]
                if isinstance(target, dict):
                    target_module_id = target.get("module_id")
        
        if not target_module_id:
            # Fallback search
            mod_res = await self.db.execute(select(LearningModule).where(LearningModule.is_active == True).order_by(LearningModule.order))
            modules = mod_res.scalars().all()
            if modules:
                target_module_id = modules[0].id

        if target_module_id:
            db_module = await self.db.execute(select(LearningModule).where(LearningModule.id == target_module_id))
            mod_record = db_module.scalars().first()
            if mod_record:
                context_title = mod_record.title

        # Phase A: Core Lesson (if available for the target module)
        if target_module_id:
            lesson_res = await self.db.execute(
                select(Lesson).where(Lesson.module_id == target_module_id).order_by(Lesson.order)
            )
            lessons = lesson_res.scalars().all()
            if lessons:
                # Add one core lesson activity block explicitly
                target_lesson = lessons[0]
                
                # Check for in-progress Activity Sessions to filter out completed activities
                completed_activities_res = await self.db.execute(
                    select(ActivitySession.activity_id).where(
                        and_(
                            ActivitySession.user_id == str(user_id),
                            ActivitySession.completed == True
                        )
                    )
                )
                completed_activity_ids = {a for a in completed_activities_res.scalars().all()}
                
                act_res = await self.db.execute(
                    select(LearningActivity).where(
                        and_(LearningActivity.lesson_id == target_lesson.id, LearningActivity.status == 'Published')
                    ).order_by(LearningActivity.order)
                )
                module_activities = act_res.scalars().all()
                
                count_added = 0
                for a in module_activities:
                    # IMPLEMENTATION: Resume Learning (skip completed activities)
                    if a.id not in completed_activity_ids and count_added < activity_cap:
                        planned_activities.append(a)
                        count_added += 1

        # Phase B: Spaced Revision 
        # Check sessions from the user older than 2 days
        two_days_ago = datetime.now(timezone.utc) - timedelta(days=2)
        session_res = await self.db.execute(
            select(ActivitySession).where(
                and_(
                    ActivitySession.user_id == str(user_id),
                    ActivitySession.completed == True,
                    ActivitySession.completed_at < two_days_ago
                )
            ).order_by(ActivitySession.accuracy.asc()) # Lowest accuracy first
        )
        sessions = session_res.scalars().all()
        # Ensure we don't repeat activities already in the plan
        existing_ids = {a.id for a in planned_activities}
        for s in sessions:
            if s.activity_id not in existing_ids and len(planned_activities) < (activity_cap + 1):
                # Bring in the activity
                act_lookup = await self.db.execute(select(LearningActivity).where(LearningActivity.id == s.activity_id))
                rev_act = act_lookup.scalars().first()
                if rev_act and rev_act.status == 'Published':
                    planned_activities.append(rev_act)
                    existing_ids.add(rev_act.id)

        # 3. Format Response
        # ------------------
        response_activities = []
        for act in planned_activities:
            # Safely parse JSONB props
            meta = act.metadata_fields if isinstance(act.metadata_fields, dict) else {}
            rewards = act.rewards if isinstance(act.rewards, dict) else {"xp": 10}
            
            total_time_seconds += int(meta.get("estimated_duration", 300))
            total_xp_pool += int(rewards.get("xp", 10))
            
            response_activities.append(
                UnifiedActivityResponse(
                    id=str(act.id),
                    activity_type=str(act.activity_type),
                    title=str(act.title),
                    module_id=str(act.module_id),
                    lesson_id=str(act.lesson_id) if act.lesson_id else None,
                    metadata=meta,
                    content=act.content if isinstance(act.content, dict) else {},
                    adaptive_settings=act.adaptive_settings if isinstance(act.adaptive_settings, dict) else {},
                    rewards=rewards,
                    version=str(act.version),
                    status=str(act.status)
                )
            )

        # Calculate formatted time string
        minutes = total_time_seconds // 60
        if minutes == 0: minutes = 5
        estimated_time_str = f"{minutes}-{minutes + 5} minutes"

        return TodaysLearningResponse(
            estimated_time=estimated_time_str,
            total_xp=total_xp_pool,
            module_context=str(context_title) if context_title else None,
            activities=response_activities
        )
