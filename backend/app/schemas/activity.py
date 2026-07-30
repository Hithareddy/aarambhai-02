"""
Pydantic schemas for learner daily activity operations.
"""
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field


class ActivitySyncRequest(BaseModel):
    """
    Schema for syncing active time increment.
    Client provides its local date string (YYYY-MM-DD) and active seconds increment per category.
    """
    activity_date: date = Field(..., description="Learner's local date (YYYY-MM-DD)")
    assessment_seconds: int = Field(default=0, ge=0, le=3600, description="Active seconds spent on assessments")
    lesson_seconds: int = Field(default=0, ge=0, le=3600, description="Active seconds spent on lessons")
    game_seconds: int = Field(default=0, ge=0, le=3600, description="Active seconds spent on games")
    ai_tutor_seconds: int = Field(default=0, ge=0, le=3600, description="Active seconds spent with AI tutor")
    general_seconds: int = Field(default=0, ge=0, le=3600, description="Active seconds spent on general platform pages")


class DailyGoalUpdatePayload(BaseModel):
    """
    Schema for setting/updating daily learning goal preference.
    """
    goal_minutes: int = Field(..., ge=1, le=480, description="Daily learning goal in minutes (1 - 480)")


class DailyActivityResponse(BaseModel):
    """
    Schema representing active learning metrics and daily goal status for a single date.
    """
    activity_date: date
    total_active_seconds: int
    assessment_seconds: int
    lesson_seconds: int
    game_seconds: int
    ai_tutor_seconds: int
    general_seconds: int
    goal_minutes: int = 20
    goal_eligible_seconds: int = 0
    goal_completed: bool = False
    bonus_learning_minutes: int = 0

    class Config:
        from_attributes = True


class CategoryBreakdown(BaseModel):
    """
    Category breakdown in seconds and percentage.
    """
    category: str
    label: str
    seconds: int
    minutes: float


class ActivitySummaryResponse(BaseModel):
    """
    Aggregated activity summary across a specified period (today, week, month).
    """
    period: str  # "today", "week", "month"
    reference_date: date
    total_active_seconds: int
    total_active_minutes: int
    assessment_seconds: int
    lesson_seconds: int
    game_seconds: int
    ai_tutor_seconds: int
    general_seconds: int
    current_goal_minutes: int = 20
    today_goal_eligible_seconds: int = 0
    today_goal_completed: bool = False
    today_bonus_learning_minutes: int = 0
    active_days_count: int
    categories: List[CategoryBreakdown]
    daily_records: List[DailyActivityResponse]


class MonthCalendarResponse(BaseModel):
    """
    Full monthly calendar response for a specific year and month.
    """
    year: int
    month: int
    total_active_seconds: int
    total_active_minutes: int
    goal_completed_days_count: int
    active_days_count: int
    days_in_month: int
    daily_records: List[DailyActivityResponse]


class StreakResponse(BaseModel):
    """
    Schema for learner streak statistics.
    Derived dynamically from historical goal-completed activity records.
    """
    current_streak: int
    longest_streak: int
    today_completed: bool
    last_completed_date: Optional[date] = None
    is_new_learner: bool = False


