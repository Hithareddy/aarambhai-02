"""
User management endpoints.

Handles user profile operations.
"""
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
):
    """
    Get current user profile.

    Returns the profile of the currently authenticated user.

    Args:
        current_user: The current authenticated user (from dependency)

    Returns:
        UserResponse: Current user profile data
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update current user profile.

    Allows users to update their profile information.

    Args:
        user_update: Update data (full_name, email)
        current_user: The current authenticated user (from dependency)
        db: Database session

    Returns:
        UserResponse: Updated user profile data

    Raises:
        HTTPException: If email already exists (409 Conflict)
    """
    user_service = UserService(db)
    
    try:
        updated_user = await user_service.update_user(current_user.id, user_update)
    except ValueError as e:
        if "Email already registered" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        full_name=updated_user.full_name,
        is_active=updated_user.is_active,
        is_verified=updated_user.is_verified,
        created_at=updated_user.created_at,
    )
