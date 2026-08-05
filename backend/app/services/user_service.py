"""
User service layer.

Handles business logic for user operations including authentication and profile management.
"""
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """Service for user-related business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, user_data: UserCreate) -> User:
        """
        Create a new user.

        Checks if email already exists, hashes the password, and creates a new user record.

        Args:
            user_data: User creation data

        Returns:
            Created user

        Raises:
            ValueError: If email already exists
        """
        # Check if email already exists
        existing_user = await self.get_user_by_email(user_data.email)
        if existing_user:
            raise ValueError("Email already registered")

        # Hash the password
        hashed_password = get_password_hash(user_data.password)

        # Create new user
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            is_active=True,
            is_verified=False,
            is_superuser=False,
        )

        try:
            self.db.add(new_user)
            await self.db.commit()
            await self.db.refresh(new_user)
            return new_user

        except Exception:
            await self.db.rollback()
            import traceback
            traceback.print_exc()
            raise

    async def get_user_by_id(self, user_id: str) -> User | None:
        """
        Get user by ID.

        Args:
            user_id: User ID

        Returns:
            User if found, None otherwise
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> User | None:
        """
        Get user by email.

        Args:
            email: User email

        Returns:
            User if found, None otherwise
        """
        result = await self.db.execute(select(User).where(User.email.ilike(email)))
        return result.scalar_one_or_none()

    async def update_user(self, user_id: str, user_data: UserUpdate) -> User:
        """
        Update user profile.

        Args:
            user_id: User ID
            user_data: Update data

        Returns:
            Updated user

        Raises:
            ValueError: If user not found
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        # Update fields if provided
        if user_data.full_name is not None:
            user.full_name = user_data.full_name
        if user_data.email is not None:
            # Check if new email already exists
            existing_user = await self.get_user_by_email(user_data.email)
            if existing_user and existing_user.id != user_id:
                raise ValueError("Email already registered")
            user.email = user_data.email

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def authenticate_user(self, email: str, password: str) -> User | None:
        """
        Authenticate user with email and password.

        Gets user by email, verifies password hash, and updates last_login timestamp.

        Args:
            email: User email
            password: Plain text password

        Returns:
            User if authentication successful, None otherwise
        """
        user = await self.get_user_by_email(email)
        if not user:
            return None

        # Verify password
        if not verify_password(password, user.hashed_password):
            return None

        # Check if user is active
        if not user.is_active:
            return None

        # Update last_login
        user.last_login = datetime.now(timezone.utc).replace(tzinfo=None)
        await self.db.commit()
        await self.db.refresh(user)

        return user
