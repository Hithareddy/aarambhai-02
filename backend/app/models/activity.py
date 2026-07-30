"""
Learner daily activity model for tracking active learning time.

Stores aggregated active seconds per learner per date, broken down by learning categories
(assessment, lessons, games, ai_tutor, general).
"""
import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Column, String, Integer, Date, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class LearnerDailyActivity(Base, TimestampMixin):
    """
    Persistent model for aggregated daily learner active time.

    Tracks active learning time in seconds per category for each user per calendar date.
    """

    __tablename__ = "learner_daily_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Activity Date (learner's local date or UTC date format YYYY-MM-DD)
    activity_date = Column(Date, nullable=False, index=True)

    # Time breakdown in seconds
    total_active_seconds = Column(Integer, default=0, nullable=False)
    assessment_seconds = Column(Integer, default=0, nullable=False)
    lesson_seconds = Column(Integer, default=0, nullable=False)
    game_seconds = Column(Integer, default=0, nullable=False)
    ai_tutor_seconds = Column(Integer, default=0, nullable=False)
    general_seconds = Column(Integer, default=0, nullable=False)

    # Daily Goal Snapshot (minutes)
    goal_minutes = Column(Integer, default=20, nullable=False)

    # Relationship to user
    user = relationship("User", backref="daily_activities")

    __table_args__ = (
        UniqueConstraint("user_id", "activity_date", name="uq_user_daily_activity_date"),
    )

    def __repr__(self) -> str:
        return (
            f"<LearnerDailyActivity(user_id={self.user_id}, date={self.activity_date}, "
            f"total_seconds={self.total_active_seconds})>"
        )
