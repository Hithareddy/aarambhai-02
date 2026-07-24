from pydantic import BaseModel, ConfigDict, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID

# --- Blocks ---
class ContentBlock(BaseModel):
    id: str = Field(..., description="Unique identifier for the block")
    type: str = Field(..., description="E.g., text, image, audio, vocabulary, interactive")
    content: Dict[str, Any] = Field(default_factory=dict, description="Payload for the block rendering")
    order: int = Field(default=1)

# --- Module ---
class LearningModuleBase(BaseModel):
    title: str
    description: Optional[str] = None
    skill: str
    difficulty: int = 1
    estimated_duration: int = 15
    prerequisites: List[str] = Field(default_factory=list)
    order: int = 1
    is_active: bool = True

class LearningModuleCreate(LearningModuleBase):
    id: str

class LearningModuleInDB(LearningModuleBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Lesson ---
class LessonBase(BaseModel):
    module_id: str
    title: str
    lesson_type: str = "learning"
    schema_version: str = "v1"
    content_blocks: List[Any] = Field(default_factory=list)
    completion_criteria: Dict[str, Any] = Field(default_factory=dict)
    order: int = 1

class LessonCreate(LessonBase):
    id: str

class LessonInDB(LessonBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LearningModuleWithLessons(LearningModuleInDB):
    lessons: List[LessonInDB] = []

# --- Progress ---
class LessonProgressBase(BaseModel):
    lesson_id: str
    status: str = "not_started"
    progress_percentage: float = 0.0
    score: Optional[float] = None
    time_spent_seconds: int = 0

class LessonProgressUpdate(BaseModel):
    status: Optional[str] = None
    progress_percentage: Optional[float] = None
    score: Optional[float] = None
    time_spent_seconds: Optional[int] = None
    completed_at: Optional[datetime] = None
    
    # Adaptive Engine Outcomes (Sprint 10)
    quiz_accuracy: Optional[float] = None
    pronunciation_score: Optional[float] = None
    hints_used: Optional[int] = None

class LessonProgressInDB(LessonProgressBase):
    id: UUID
    user_id: UUID
    started_at: Optional[datetime] = None
    last_accessed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ModuleProgressInDB(BaseModel):
    id: UUID
    user_id: UUID
    module_id: str
    progress_percentage: float = 0.0
    completed_lessons_count: int = 0
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Recommendations (Sprint 10 & 10.1) ---
class RecommendationReason(BaseModel):
    type: str = Field(..., description="E.g., resume, reinforce, revision, next_in_sequence, fallback")
    skill: str = Field(..., description="The language skill targeted")
    message: str = Field(..., description="Human-readable explanation of why this lesson was chosen")

class RecommendedLessonResponse(BaseModel):
    lesson: LessonInDB
    reason: RecommendationReason

class SkillProfileOut(BaseModel):
    skill: str
    current_level: int
    mastery_percentage: float
    confidence_score: float
    
    model_config = ConfigDict(from_attributes=True)
