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


@router.get("/me/report")
async def get_my_assessment_report(
    current_user=Depends(get_current_active_user),
    db=Depends(get_db),
):
    """
    Fetch comprehensive professional diagnostic assessment report for current learner.
    """
    from app.services.assessment_service import AssessmentService
    service = AssessmentService(db)
    history = await service.get_assessment_history(current_user.id)
    if not history:
        return {"report": None, "has_assessment": False}
    
    latest = history[0]
    learner_prof = await LearnerService(db).get_learner_profile_by_user_id(current_user.id)
    
    return {
        "has_assessment": True,
        "learner_name": learner_prof.name if learner_prof else current_user.full_name,
        "age_group": learner_prof.age_group if learner_prof else "General",
        "role": learner_prof.current_role if learner_prof else "Learner",
        "website_language": learner_prof.website_language if learner_prof else "en",
        "learning_language": learner_prof.learning_language if learner_prof else "en",
        "report": latest
    }
