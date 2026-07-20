"""
Pydantic schemas for assessment operations.

Defines request/response schemas for assessment blueprints, sessions, and results.
"""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AssessmentBlueprintBase(BaseModel):
    """Base assessment blueprint schema."""

    learning_goal: str = Field(..., max_length=100)
    question_count: int = Field(..., gt=0)
    min_difficulty: int = Field(..., ge=1, le=5)
    max_difficulty: int = Field(..., ge=1, le=5)
    estimated_duration_minutes: int = Field(..., gt=0)


class AssessmentBlueprintCreate(AssessmentBlueprintBase):
    """Schema for creating assessment blueprint."""

    domains: list[str]
    skills: list[str]
    question_distribution: dict[str, Any]


class AssessmentBlueprintResponse(AssessmentBlueprintBase):
    """Schema for assessment blueprint response."""

    id: str
    domains: list[str]
    skills: list[str]
    question_distribution: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class AssessmentSessionBase(BaseModel):
    """Base assessment session schema."""

    # Optional: when omitted, the backend provisions a default adaptive
    # blueprint so a learner can start the initial placement without first
    # generating a blueprint explicitly.
    blueprint_id: str | None = None


class AssessmentSessionCreate(AssessmentSessionBase):
    """Schema for creating assessment session."""

    pass


class AssessmentSessionResponse(BaseModel):
    """Schema for assessment session response."""

    id: str
    learner_id: str
    blueprint_id: str
    status: str
    current_question_index: int
    current_difficulty: int
    start_time: datetime
    end_time: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionResponseCreate(BaseModel):
    """Schema for submitting question response."""

    question_id: str
    selected_answer: str | list[str]
    response_time_seconds: int = Field(..., ge=0)


class QuestionResponseResponse(BaseModel):
    """Schema for question response."""

    id: str
    session_id: str
    question_id: str
    is_correct: bool
    response_time_seconds: int
    difficulty_at_response: int
    created_at: datetime

    class Config:
        from_attributes = True


class AssessmentResultBase(BaseModel):
    """Base assessment result schema."""

    overall_proficiency: str = Field(..., max_length=20)
    confidence_score: float = Field(..., ge=0, le=1)
    readiness_level: str = Field(..., max_length=20)


class AssessmentResultResponse(AssessmentResultBase):
    """Schema for assessment result response."""

    id: str
    session_id: str
    learner_id: str
    skill_proficiencies: list[dict[str, Any]]
    strengths: list[str]
    weaknesses: list[str]
    learning_path: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
