"""
Pydantic schemas for user-related operations.

Defines request/response schemas for user authentication and profile management.
"""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)


class UserCreate(UserBase):
    """Schema for user registration."""

    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    full_name: str | None = Field(None, min_length=1, max_length=255)
    email: EmailStr | None = None


class UserInDB(UserBase):
    """Schema for user data as stored in database."""

    id: str
    hashed_password: str
    is_active: bool
    is_verified: bool
    is_superuser: bool
    last_login: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """Schema for user response (excluding sensitive data)."""

    id: str
    email: EmailStr
    full_name: str
    is_active: bool
    is_verified: bool
    is_superuser: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for JWT token payload."""

    sub: str | None = None
    exp: int | None = None
    type: str | None = None


class LoginRequest(BaseModel):
    """Schema for login request."""

    email: EmailStr
    password: str
