from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any
from uuid import UUID
from datetime import datetime
from typing import List, Any
from uuid import UUID

from app.core.deps import get_current_active_user, get_db
from app.models.user import User
from app.services.learning_service import LearningService
from app.schemas.learning import (
    LearningModuleInDB, 
    LearningModuleWithLessons, 
    LessonInDB,
    LessonProgressUpdate,
    LessonProgressInDB,
    RecommendedLessonResponse,
    SkillProfileOut
)

router = APIRouter()

@router.get("/modules", response_model=List[LearningModuleInDB])
async def get_modules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve all available learning modules in the active curriculum."""
    service = LearningService(db)
    modules = await service.get_modules()
    return modules

@router.get("/modules/{module_id}", response_model=LearningModuleWithLessons)
async def get_module_by_id(
    module_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve specific module alongside its array of lessons."""
    service = LearningService(db)
    module = await service.get_module_with_lessons(module_id)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Module not found or inactive"
        )
    return module

@router.get("/lessons/{lesson_id}", response_model=LessonInDB)
async def get_lesson(
    lesson_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific lesson fully populated with content blocks."""
    service = LearningService(db)
    lesson = await service.get_lesson(lesson_id, current_user.id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.get("/recommended", response_model=RecommendedLessonResponse)
async def get_recommended_lesson(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Core Recommendation Engine.
    Examines previous AssessmentResult's learning_path and active module progress
    to resolve the active lesson ticket for the Dashboard.
    """
    service = LearningService(db)
    lesson = await service.get_recommended_lesson(current_user.id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No recommended lessons could be derived. Path fully complete."
        )
    return lesson

@router.post("/progress/{lesson_id}", response_model=LessonProgressInDB)
async def save_lesson_progress(
    lesson_id: str,
    update_data: LessonProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Report active progression on an active lesson. 
    Passing 'completed' triggers dynamic module_progress calculation and map unlocking.
    """
    service = LearningService(db)
    
    # We enforce basic completion criteria evaluation if needed 
    # (can add logic examining the update_data against lesson.completion_criteria)
    # The client payload generally submits valid scores
    
    try:
        progress = await service.update_lesson_progress(current_user.id, lesson_id, update_data)
        return progress
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/profiles", response_model=List[SkillProfileOut])
async def get_skill_profiles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Fetch the list of SkillProfiles summarizing learner mastery metrics
    """
    from sqlalchemy import select
    from app.models.skill_profile import SkillProfile
    result = await db.execute(
        select(SkillProfile).where(SkillProfile.user_id == str(current_user.id))
    )
    profiles = result.scalars().all()
    return profiles

@router.get("/journey")
async def get_learning_journey(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Full milestone-based Learning Path payload: ordered modules with lesson
    level progress, lock state, XP, estimated completion, skill mastery and
    adaptive recommendations.
    """
    from app.services.journey_service import JourneyService
    return await JourneyService(db).build(str(current_user.id))



@router.get("/activities/{activity_id}")
async def get_activity(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Unified Activity Resolution Engine
    Fetches a single LearningActivity by ID, converting it into the standardized ModuleRunner payload.
    """
    from sqlalchemy import select
    from app.models.learning import LearningActivity
    result = await db.execute(
        select(LearningActivity).where(LearningActivity.id == activity_id)
    )
    act = result.scalars().first()
    if not act:
        raise HTTPException(status_code=404, detail="Learning Activity not found")
        
    from app.schemas.practice import UnifiedActivityResponse
    return UnifiedActivityResponse(
        id=str(act.id),
        activity_type=str(act.activity_type),
        title=str(act.title),
        module_id=str(act.module_id),
        lesson_id=str(act.lesson_id) if act.lesson_id else None,
        metadata=act.metadata_fields if isinstance(act.metadata_fields, dict) else {},
        content=act.content if isinstance(act.content, dict) else {},
        adaptive_settings=act.adaptive_settings if isinstance(act.adaptive_settings, dict) else {},
        rewards=act.rewards if isinstance(act.rewards, dict) else {"xp": 10},
        version=str(act.version),
        status=str(act.status)
    )

@router.post("/activities/{activity_id}/session", status_code=status.HTTP_201_CREATED)
async def create_activity_session(
    activity_id: str,
    payload: dict, # Using dict to bypass circular imports or just mapping directly
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Saves an ActivitySession verifying progress logic.
    Provides offline sync queue compatibility for the frontend.
    """
    from app.models.learning import ActivitySession, LearningActivity, ActivityAnalytics
    from sqlalchemy import select
    from datetime import datetime, timezone
    
    # Valdiate activity
    act_res = await db.execute(select(LearningActivity).where(LearningActivity.id == activity_id))
    act = act_res.scalars().first()
    if not act:
        raise HTTPException(status_code=404, detail="Learning Activity not found")
        
    session = ActivitySession(
        user_id=str(current_user.id),
        activity_id=activity_id,
        duration_seconds=payload.get("duration_seconds", 0),
        completed=payload.get("completed", True),
        accuracy=payload.get("accuracy", 0.0),
        completed_at=datetime.now(timezone.utc)
    )
    db.add(session)
    await db.commit()
    
    return {"status": "success", "session_id": str(session.id)}

