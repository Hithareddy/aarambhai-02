"""
Learner service layer.

Handles business logic for learner profile operations.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.learner import LearnerProfile
from app.schemas.learner import LearnerProfileCreate, LearnerProfileUpdate


class LearnerService:
    """Service for learner profile business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_learner_profile(
        self, profile_data: LearnerProfileCreate, user_id: str
    ) -> LearnerProfile:
        """
        Create a learner profile for a user, or update it if one already exists.

        Onboarding submits the profile once, but a learner may revisit and
        resubmit, so this behaves as an idempotent upsert keyed on ``user_id``.

        Args:
            profile_data: Learner profile creation data
            user_id: Authenticated user ID

        Returns:
            The created or updated learner profile
        """
        existing = await self.get_learner_profile_by_user_id(user_id)
        if existing is not None:
            return await self.update_learner_profile(
                user_id, LearnerProfileUpdate(**profile_data.model_dump())
            )

        profile = LearnerProfile(user_id=user_id, **profile_data.model_dump())
        self.db.add(profile)
        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def get_learner_profile_by_user_id(self, user_id: str) -> LearnerProfile | None:
        """
        Get learner profile by user ID.

        Args:
            user_id: User ID

        Returns:
            Learner profile if found, None otherwise
        """
        result = await self.db.execute(
            select(LearnerProfile).where(LearnerProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def update_learner_profile(
        self, user_id: str, profile_data: LearnerProfileUpdate
    ) -> LearnerProfile:
        """
        Update an existing learner profile.

        Args:
            user_id: User ID
            profile_data: Update data (only set fields are applied)

        Returns:
            Updated learner profile

        Raises:
            ValueError: If profile not found
        """
        profile = await self.get_learner_profile_by_user_id(user_id)
        if profile is None:
            raise ValueError("Learner profile not found")

        data = profile_data.model_dump(exclude_unset=True)
        if "name" in data:
            profile.name = data["name"]
        if "age_group" in data:
            profile.age_group = data["age_group"]
        if "educational_background" in data:
            profile.educational_background = data["educational_background"]
        if "current_role" in data:
            profile.current_role = data["current_role"]
        if "learning_goal" in data:
            profile.learning_goal = data["learning_goal"]
        if "learning_language" in data:
            profile.learning_language = data["learning_language"]
        if "current_familiarity" in data:
            profile.current_familiarity = data["current_familiarity"]
        if "digital_comfort" in data:
            profile.digital_comfort = data["digital_comfort"]
        if "assessment_completed" in data:
            profile.assessment_completed = data["assessment_completed"]

        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def mark_assessment_completed(self, user_id: str) -> None:
        """Flag the learner's profile as having completed an assessment."""
        profile = await self.get_learner_profile_by_user_id(user_id)
        if profile is not None and not profile.assessment_completed:
            profile.assessment_completed = True
            await self.db.commit()

    async def analyze_profile(self, user_id: str) -> dict:
        """
        Analyze learner profile for assessment blueprint generation.

        TODO: Implement profile analysis
        - Calculate profile complexity
        - Determine appropriate difficulty range
        - Identify priority domains
        - Generate profile insights

        Args:
            user_id: User ID

        Returns:
            Profile analysis results
        """
        raise NotImplementedError("Profile analysis not yet implemented")
