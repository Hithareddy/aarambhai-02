from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

class ResourceBase(BaseModel):
    title: str
    type: str  # article | cheat_sheet | worksheet | video
    category: str
    description: str
    content: Optional[str] = None
    youtube_id: Optional[str] = None
    video_channel: Optional[str] = None
    duration: str
    download_url: Optional[str] = None
    recommended_skill: Optional[str] = None
    target_language: str = "en"
    age_groups: Optional[str] = "all"
    difficulty_level: str = "beginner"

class ResourceCreate(ResourceBase):
    pass

class ResourceOut(ResourceBase):
    id: str
    is_active: bool
    created_at: datetime
    is_bookmarked: bool = False

    class Config:
        from_attributes = True

class RecommendedResourceResponse(BaseModel):
    resources: List[ResourceOut]
    recommendation_reason: str
    target_skill: str
