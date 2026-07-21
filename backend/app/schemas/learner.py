"""
Pydantic schemas for learner profile operations.

Defines request/response schemas for learner profile management.
"""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class LearnerProfileBase(BaseModel):
    """Base learner profile schema with common fields."""

    name: str = Field(..., min_length=1, max_length=255)
    age_group: str = Field(..., max_length=50)
    educational_background: str = Field(..., max_length=100)
    current_role: str = Field(..., max_length=100)
    learning_goal: str = Field(..., max_length=100)
    learning_language: str = Field(..., max_length=10)
    website_language: str = Field(default="en", max_length=10)
    current_familiarity: str = Field(..., max_length=50)
    digital_comfort: str = Field(..., max_length=50)


class LearnerProfileCreate(LearnerProfileBase):
    """Schema for creating learner profile."""

    pass  # user_id will be extracted from authenticated user


class LearnerProfileUpdate(BaseModel):
    """Schema for updating learner profile."""

    name: str | None = Field(None, min_length=1, max_length=255)
    age_group: str | None = Field(None, max_length=50)
    educational_background: str | None = Field(None, max_length=100)
    current_role: str | None = Field(None, max_length=100)
    learning_goal: str | None = Field(None, max_length=100)
    learning_language: str | None = Field(None, max_length=10)
    website_language: str | None = Field(None, max_length=10)
    current_familiarity: str | None = Field(None, max_length=50)
    digital_comfort: str | None = Field(None, max_length=50)
    assessment_completed: bool | None = None


class LearnerProfileInDB(LearnerProfileBase):
    """Schema for learner profile as stored in database."""

    id: str
    user_id: str
    assessment_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LearnerProfileResponse(LearnerProfileInDB):
    """Schema for learner profile response."""

    pass
