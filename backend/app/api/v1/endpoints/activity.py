"""
Endpoints for active learning-time tracking.
"""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.activity import (
    ActivitySyncRequest,
    DailyActivityResponse,
    ActivitySummaryResponse,
    DailyGoalUpdatePayload,
    MonthCalendarResponse,
    StreakResponse,
)
from app.services.activity_service import ActivityService

router = APIRouter()


@router.put(
    "/goal",
    response_model=DailyActivityResponse,
    status_code=status.HTTP_200_OK,
)
async def update_daily_goal(
    payload: DailyGoalUpdatePayload,
    target_date: Optional[date] = Query(None, alias="date", description="Learner's local date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Set or update the authenticated learner's preferred daily learning goal.
    Updates the learner's profile preference and today's activity snapshot goal immediately.
    """
    ref_date = target_date or date.today()
    service = ActivityService(db)
    return await service.update_daily_goal(current_user.id, payload.goal_minutes, ref_date)


@router.post(
    "/sync",
    response_model=DailyActivityResponse,
    status_code=status.HTTP_200_OK,
)
async def sync_activity_time(
    payload: ActivitySyncRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Persist accumulated active learning time increment for the authenticated user.
    Uses JWT authentication to derive user identity safely.
    """
    service = ActivityService(db)
    record = await service.sync_active_time(current_user.id, payload)
    return DailyActivityResponse.model_validate(record)


@router.get(
    "/today",
    response_model=DailyActivityResponse,
    status_code=status.HTTP_200_OK,
)
async def get_today_activity(
    target_date: Optional[date] = Query(None, alias="date", description="Learner's local date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve today's active time breakdown for the authenticated learner.
    """
    ref_date = target_date or date.today()
    service = ActivityService(db)
    return await service.get_today_activity(current_user.id, ref_date)


@router.get(
    "/summary",
    response_model=ActivitySummaryResponse,
    status_code=status.HTTP_200_OK,
)
async def get_activity_summary(
    period: str = Query("today", regex="^(today|week|month)$"),
    target_date: Optional[date] = Query(None, alias="date", description="Reference date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve activity metrics and category breakdowns for today, this week, or this month.
    """
    ref_date = target_date or date.today()
    service = ActivityService(db)
    return await service.get_activity_summary(current_user.id, period, ref_date)


@router.get(
    "/month",
    response_model=MonthCalendarResponse,
    status_code=status.HTTP_200_OK,
)
async def get_month_calendar(
    year: int = Query(..., ge=2020, le=2100, description="Calendar year"),
    month: int = Query(..., ge=1, le=12, description="Calendar month (1 - 12)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve all daily activity records, snapshot goals, and goal completion statuses for a specific calendar month.
    Executes a single authenticated SQL query.
    """
    service = ActivityService(db)
    return await service.get_month_calendar(current_user.id, year, month)


@router.get(
    "/streak",
    response_model=StreakResponse,
    status_code=status.HTTP_200_OK,
)
async def get_streak_stats(
    target_date: Optional[date] = Query(None, alias="date", description="Reference date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve authenticated learner streak statistics derived dynamically from historical activity records.
    """
    service = ActivityService(db)
    return await service.get_streak_stats(current_user.id, target_date)
