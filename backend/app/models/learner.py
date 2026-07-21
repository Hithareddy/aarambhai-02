"""
Learner profile model for storing learner information.

Stores detailed learner profile data collected during onboarding,
including demographics, learning goals, and preferences.
"""
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class LearnerProfile(Base, TimestampMixin):
    """
    Learner profile model.

    Stores comprehensive learner information collected during onboarding.
    This data is used for personalized learning path generation.
    """

    __tablename__ = "learner_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), unique=True, nullable=False, index=True
    )

    # Basic Information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    age_group: Mapped[str] = mapped_column(String(50), nullable=False)

    # Educational Background
    educational_background: Mapped[str] = mapped_column(String(100), nullable=False)

    # Current Role
    current_role: Mapped[str] = mapped_column(String(100), nullable=False)

    # Learning Preferences
    learning_goal: Mapped[str] = mapped_column(String(100), nullable=False)
    learning_language: Mapped[str] = mapped_column(String(10), nullable=False)
    website_language: Mapped[str] = mapped_column(String(10), nullable=False, default="en", server_default="en")
    current_familiarity: Mapped[str] = mapped_column(String(50), nullable=False)
    digital_comfort: Mapped[str] = mapped_column(String(50), nullable=False)

    # Assessment Status
    assessment_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationship to user
    user: Mapped["User"] = relationship("User", back_populates="learner_profile")

    def __repr__(self) -> str:
        return f"<LearnerProfile(id={self.id}, name={self.name}, goal={self.learning_goal})>"
