"""
Learner profile endpoints.

Handles learner profile operations including onboarding data.
"""
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_active_user, get_db
from app.schemas.learner import (
    LearnerProfileCreate,
    LearnerProfileResponse,
    LearnerProfileUpdate,
)
from app.services.learner_service import LearnerService

router = APIRouter()


@router.post("/", response_model=LearnerProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_learner_profile(
    profile: LearnerProfileCreate,
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Create (or upsert) the current user's learner profile from onboarding data.

    Returns:
        LearnerProfileResponse: Created learner profile
    """
    service = LearnerService(db)
    return await service.create_learner_profile(profile, current_user.id)


@router.get("/me", response_model=LearnerProfileResponse)
async def get_my_learner_profile(
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Get the current user's learner profile.

    Returns:
        LearnerProfileResponse: Learner profile data
    """
    service = LearnerService(db)
    profile = await service.get_learner_profile_by_user_id(current_user.id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learner profile not found",
        )
    return profile


@router.put("/me", response_model=LearnerProfileResponse)
async def update_my_learner_profile(
    profile_update: LearnerProfileUpdate,
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Update the current user's learner profile.

    Returns:
        LearnerProfileResponse: Updated learner profile
    """
    service = LearnerService(db)
    try:
        return await service.update_learner_profile(current_user.id, profile_update)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
