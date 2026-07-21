"""
Pydantic schemas for question bank operations.

Defines request/response schemas for question management.
"""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class QuestionBase(BaseModel):
    """Base question schema."""

    learning_goal: str = Field(..., max_length=100)
    domain: str = Field(..., max_length=100)
    skill: str = Field(..., max_length=100)
    difficulty: int = Field(..., ge=1, le=5)
    question_type: str = Field(..., max_length=50)
    language: str = Field(default="en", max_length=10)


class QuestionCreate(QuestionBase):
    """Schema for creating question."""

    question_content: dict[str, Any]
    options: list[dict[str, Any]]
    correct_answer: Any
    tags: list[str] | None = None


class QuestionUpdate(BaseModel):
    """Schema for updating question."""

    question_content: dict[str, Any] | None = None
    options: list[dict[str, Any]] | None = None
    correct_answer: Any | None = None
    is_active: bool | None = None
    tags: list[str] | None = None


class QuestionResponse(QuestionBase):
    """Schema for question response."""

    id: str
    question_content: dict[str, Any]
    options: list[dict[str, Any]]
    is_active: bool
    tags: list[str] | None
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionForAssessment(QuestionBase):
    """Schema for question in assessment (excludes correct answer)."""

    id: str
    question_content: dict[str, Any]
    options: list[dict[str, Any]]
    is_fallback: bool | None = None

    class Config:
        from_attributes = True
