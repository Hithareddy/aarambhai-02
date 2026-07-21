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
    LessonProgressInDB
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
    
    # ---------------------------------------------------------
    # HARDCODED SPRINT 8 BLOCK SHOWCASE OVERRIDE
    # ---------------------------------------------------------
    if lesson_id == "interactive_mock":
        return LessonInDB(
            id="interactive_mock",
            module_id="core_vocabulary",
            title="Interactive Learning Showcase",
            lesson_type="learning",
            schema_version="v1",
            order=1,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            content_blocks=[
                {"id": "b1-t", "type": "text", "content": {"heading": "Welcome to Interactive Lessons!", "body": "This lesson demonstrates all 10 block varieties inside the Aarambh AI engine."}},
                {"id": "b1-img", "type": "image", "content": {"url": "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800", "caption": "A dynamic learning environment.", "alt": "Learning"}},
                {"id": "b1-voc", "type": "vocabulary", "content": {"word": "Interactive", "pronunciation": "in-ter-AK-tiv", "definition": "Influencing or having an effect on each other.", "example": "The learning platform is highly interactive.", "audio": ""}},
                {"id": "b1-aud", "type": "audio", "content": {"title": "Listen to this phrase", "url": "https://webaudioapi.com/samples/audio-tag/chrono.mp3", "transcript": "Time flies when you are having fun."}},
                {"id": "b1-flsh", "type": "flashcard", "content": {"front": "What is the capital of India?", "back": "New Delhi"}},
                {"id": "b1-qz", "type": "quiz", "content": {"question": "Did you flip the flashcard?", "options": [{"id": "a", "text": "Yes, I did!"}, {"id": "b", "text": "No, I did not."}], "correctAnswer": "a", "explanation": "Awesome! Activity completed."}},
                {"id": "b1-conv", "type": "conversation", "content": {"dialogue": [{"speaker": "ai", "text": "Are you enjoying the new lesson?"}, {"speaker": "learner", "text": "Yes, it is very interactive!"}, {"speaker": "ai", "text": "Great to hear!"}]}},
                {"id": "b1-pron", "type": "pronunciation", "content": {"text": "I am learning English."}},
                {"id": "b1-sent", "type": "sentence_builder", "content": {"target_sentence": "This is a great lesson."}},
                {"id": "b1-rcp", "type": "recap", "content": {"title": "Showcase Completed", "points": ["You interacted with a vocabulary card.", "You took a practice quiz.", "You practiced speaking and dialogue."]}},
            ],
            completion_criteria={"type": "interactive"}
        )

    service = LearningService(db)
    lesson = await service.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.get("/recommended", response_model=LessonInDB)
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
