"""
Authentication endpoints.

Handles user registration, login, token refresh, and logout.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

from app.core.deps import get_db, get_current_user
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.schemas.user import LoginRequest, Token, UserCreate, UserResponse
from app.services.user_service import UserService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()
security = HTTPBearer()


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=Token)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user account.

    Validates email uniqueness, hashes password with bcrypt, creates user record,
    and returns JWT tokens for immediate authentication.

    Args:
        user_data: User registration data (email, full_name, password)
        db: Database session

    Returns:
        Token response with access_token and refresh_token

    Raises:
        HTTPException: If email already exists (409 Conflict)
    """
    user_service = UserService(db)
    
    try:
        # Create user
        user = await user_service.create_user(user_data)
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

    # Generate tokens
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user and return JWT tokens.

    Validates credentials, verifies password hash, generates access and refresh tokens,
    and updates last_login timestamp.

    Args:
        login_data: Login credentials (email, password)
        db: Database session

    Returns:
        Token response with access_token and refresh_token

    Raises:
        HTTPException: If credentials are invalid (401 Unauthorized)
    """
    user_service = UserService(db)
    
    # Authenticate user
    user = await user_service.authenticate_user(login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Generate tokens
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh access token using refresh token.

    Validates refresh token, generates new access token,
    and optionally rotates refresh token.

    Args:
        credentials: HTTP Bearer credentials containing refresh token
        db: Database session

    Returns:
        Token response with new access_token and refresh_token

    Raises:
        HTTPException: If refresh token is invalid or expired (401 Unauthorized)
    """
    token = credentials.credentials
    
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    
    # Verify it's a refresh token
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )
    
    user_id: str = payload.get("sub")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    # Verify user still exists and is active
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Generate new tokens
    access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)

    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """
    Get current user information.

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


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
):
    """
    Logout user.

    Currently relies on token expiration. In production, implement token
    blacklisting using Redis to invalidate tokens immediately.

    Args:
        current_user: The current authenticated user (from dependency)

    Returns:
        Success message
    """
    # TODO: Implement token blacklisting with Redis
    # For now, we rely on token expiration
    
    return {"message": "Successfully logged out"}