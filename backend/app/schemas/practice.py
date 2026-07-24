from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class ActivityMetadata(BaseModel):
    estimated_duration: int
    target_skill: str
    difficulty_level: int
    learner_types_supported: List[str] = []
    education_levels_supported: List[str] = []
    supported_languages: List[str] = []
    prerequisites: List[str] = []

class UnifiedActivityResponse(BaseModel):
    id: str
    activity_type: str
    title: str
    
    # Context
    module_id: str
    lesson_id: Optional[str] = None
    
    # Structured standard payloads
    metadata: Dict[str, Any]
    content: Dict[str, Any]
    adaptive_settings: Dict[str, Any]
    rewards: Dict[str, Any]
    
    version: str
    status: str

    model_config = ConfigDict(from_attributes=True)

class TodaysLearningResponse(BaseModel):
    estimated_time: str
    total_xp: int
    module_context: Optional[str] = None
    activities: List[UnifiedActivityResponse]
