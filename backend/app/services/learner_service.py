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

        Calculates profile complexity score, difficulty ranges, and priority domains
        based on the demographic details supplied in the user's profile.
        """
        profile = await self.get_learner_profile_by_user_id(user_id)
        if profile is None:
            return {
                "complexity_score": 30.0,
                "min_difficulty": 1,
                "max_difficulty": 3,
                "priority_domains": ["Reading", "Writing", "Vocabulary"],
                "priority_skills": ["reading", "writing", "vocabulary"],
                "estimated_duration_minutes": 15,
                "question_count": 8,
            }

        # Age group mapping (Weight 10%)
        # Options: ["Under 12", "12 – 17", "18 – 25", "26 – 45", "46 – 60", "60+"]
        age = profile.age_group.lower().strip()
        if "under" in age or "12" in age or "17" in age:
            age_factor = 0.5
        elif "18" in age or "25" in age:
            age_factor = 0.8
        elif "26" in age or "45" in age or "60" in age:
            age_factor = 1.0
        else:  # 60+ / Senior
            age_factor = 0.6
        
        # Educational background mapping (Weight 25%)
        # Options: ["Never went to school", "Primary school", "Secondary school", "College", "Beyond college"]
        edu = profile.educational_background.lower().strip()
        if "never" in edu:
            edu_factor = 0.2
        elif "primary" in edu:
            edu_factor = 0.4
        elif "secondary" in edu:
            edu_factor = 0.6
        elif "college" in edu:
            edu_factor = 0.8
        else:  # beyond college
            edu_factor = 1.0

        # Digital comfort mapping (Weight 25%)
        # Options: ["This is my first time", "I've used a few apps", "I use apps every day", "Very comfortable"]
        dig = profile.digital_comfort.lower().strip()
        if "first" in dig:
            dig_factor = 0.25
        elif "used a few" in dig:
            dig_factor = 0.50
        elif "every day" in dig:
            dig_factor = 0.75
        else:  # very comfortable
            dig_factor = 1.0

        # Familiarity mapping (Weight 20%)
        # Options: ["Complete beginner", "I know a little", "I'm comfortable", "I'm advanced"]
        fam = profile.current_familiarity.lower().strip()
        if "beginner" in fam:
            fam_factor = 0.25
        elif "little" in fam:
            fam_factor = 0.50
        elif "comfortable" in fam:
            fam_factor = 0.75
        else:  # advanced
            fam_factor = 1.0

        # Current role mapping (Weight 10%)
        # Options: ["Student", "Working professional", "Homemaker", "Senior citizen", "Just curious"]
        role = profile.current_role.lower().strip()
        if "senior" in role:
            role_factor = 0.4
        elif "homemaker" in role:
            role_factor = 0.6
        elif "curious" in role:
            role_factor = 0.6
        elif "student" in role:
            role_factor = 0.8
        else:  # working professional
            role_factor = 1.0

        # Goal complexity mapping (Weight 10%)
        # Options: ["Basic reading & writing", "Everyday English", "Digital skills", "General knowledge", "Career skills"]
        goal = profile.learning_goal.lower().strip()
        if "reading" in goal:
            goal_factor = 0.3
            priority_domains = ["Reading", "Writing", "Vocabulary"]
            priority_skills = ["reading", "writing", "vocabulary"]
            min_diff, max_diff = 1, 3
            est_duration = 15
            q_count = 8
        elif "english" in goal:
            goal_factor = 0.8
            priority_domains = ["Reading", "Grammar", "Listening", "Speaking", "Vocabulary"]
            priority_skills = ["reading", "grammar", "listening", "speaking", "vocabulary"]
            min_diff, max_diff = 1, 5
            est_duration = 20
            q_count = 10
        elif "digital" in goal:
            goal_factor = 0.6
            priority_domains = ["Digital Literacy"]
            priority_skills = ["smartphone_basics", "internet_navigation", "mobile_applications"]
            min_diff, max_diff = 1, 4
            est_duration = 20
            q_count = 8
        elif "knowledge" in goal:
            goal_factor = 0.6
            priority_domains = ["General Knowledge"]
            priority_skills = ["geography", "history", "polity", "current_affairs"]
            min_diff, max_diff = 1, 4
            est_duration = 15
            q_count = 8
        else:  # career skills
            goal_factor = 1.0
            priority_domains = ["Professional Skills"]
            priority_skills = ["resume_writing", "job_search", "interview_skills", "workplace_communication"]
            min_diff, max_diff = 2, 5
            est_duration = 25
            q_count = 10

        complexity_score = (
            (age_factor * 10) +
            (edu_factor * 25) +
            (dig_factor * 25) +
            (fam_factor * 20) +
            (role_factor * 10) +
            (goal_factor * 10)
        )

        return {
            "complexity_score": complexity_score,
            "min_difficulty": min_diff,
            "max_difficulty": max_diff,
            "priority_domains": priority_domains,
            "priority_skills": priority_skills,
            "estimated_duration_minutes": est_duration,
            "question_count": q_count,
        }
