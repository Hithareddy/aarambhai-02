"""
Learner profile endpoints.

Handles learner profile operations including onboarding data.
Note: Business logic not implemented yet - structure only.
"""
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_active_user, get_db
from app.schemas.learner import (
    LearnerProfileCreate,
    LearnerProfileResponse,
    LearnerProfileUpdate,
)

router = APIRouter()


@router.post("/", response_model=LearnerProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_learner_profile(
    profile: LearnerProfileCreate,
    db=Depends(get_db),
):
    """
    Create learner profile.

    Creates a new learner profile with onboarding data.
    This is typically called after user registration.

    TODO: Implement learner profile creation
    - Validate user exists
    - Create learner profile record
    - Return created profile

    Returns:
        LearnerProfileResponse: Created learner profile

    Raises:
        HTTPException: If user not found or profile already exists
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Learner profile creation not yet implemented",
    )


@router.get("/me", response_model=LearnerProfileResponse)
async def get_my_learner_profile(
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Get current user's learner profile.

    Returns the learner profile of the currently authenticated user.

    TODO: Implement learner profile retrieval

    Returns:
        LearnerProfileResponse: Learner profile data
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Learner profile retrieval not yet implemented",
    )


@router.put("/me", response_model=LearnerProfileResponse)
async def update_my_learner_profile(
    profile_update: LearnerProfileUpdate,
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Update current user's learner profile.

    Allows users to update their learner profile information.

    TODO: Implement learner profile update

    Returns:
        LearnerProfileResponse: Updated learner profile
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Learner profile update not yet implemented",
    )
