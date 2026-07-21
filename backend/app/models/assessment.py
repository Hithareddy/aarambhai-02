"""
Assessment-related models for adaptive testing.

Stores assessment blueprints, sessions, responses, and results.
"""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class AssessmentBlueprint(Base, TimestampMixin):
    """
    Assessment blueprint model.

    Stores generated assessment blueprints that define the structure
    and parameters for adaptive assessments.
    """

    __tablename__ = "assessment_blueprints"

    id: Mapped[uuid.UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    learning_goal: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    min_difficulty: Mapped[int] = mapped_column(Integer, nullable=False)
    max_difficulty: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

    # JSON fields for complex data (stored as Text)
    domains: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array
    skills: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array
    question_distribution: Mapped[str] = mapped_column(Text, nullable=False)  # JSON object

    # Relationships
    sessions: Mapped[list["AssessmentSession"]] = relationship(
        "AssessmentSession", back_populates="blueprint"
    )

    def __repr__(self) -> str:
        return f"<AssessmentBlueprint(id={self.id}, goal={self.learning_goal})>"


class AssessmentSession(Base, TimestampMixin):
    """
    Assessment session model.

    Tracks individual assessment attempts including progress,
    current state, and completion status.
    """

    __tablename__ = "assessment_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    learner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    blueprint_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("assessment_blueprints.id"), nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="in_progress"
    )  # in_progress, completed, abandoned

    current_question_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_difficulty: Mapped[int] = mapped_column(Integer, nullable=False)

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    learner: Mapped["User"] = relationship("User")
    blueprint: Mapped["AssessmentBlueprint"] = relationship("AssessmentBlueprint", back_populates="sessions")
    responses: Mapped[list["QuestionResponse"]] = relationship(
        "QuestionResponse", back_populates="session", cascade="all, delete-orphan"
    )
    result: Mapped["AssessmentResult"] = relationship(
        "AssessmentResult", back_populates="session", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<AssessmentSession(id={self.id}, status={self.status})>"


class QuestionResponse(Base, TimestampMixin):
    """
    Question response model.

    Stores learner responses to individual questions during assessments.
    """

    __tablename__ = "question_responses"

    id: Mapped[uuid.UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("assessment_sessions.id"), nullable=False
    )
    question_id: Mapped[str] = mapped_column(String(36), nullable=False)

    selected_answer: Mapped[str] = mapped_column(Text, nullable=False)  # JSON string
    is_correct: Mapped[bool] = mapped_column(nullable=False)
    response_time_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    difficulty_at_response: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    session: Mapped["AssessmentSession"] = relationship("AssessmentSession", back_populates="responses")

    def __repr__(self) -> str:
        return f"<QuestionResponse(id={self.id}, is_correct={self.is_correct})>"


class AssessmentResult(Base, TimestampMixin):
    """
    Assessment result model.

    Stores final assessment results including proficiency scores,
    skill breakdowns, and generated learning paths.
    """

    __tablename__ = "assessment_results"

    id: Mapped[uuid.UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("assessment_sessions.id"), unique=True, nullable=False
    )
    learner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )

    overall_proficiency: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    readiness_level: Mapped[str] = mapped_column(String(20), nullable=False)
    assessment_version: Mapped[str] = mapped_column(String(20), nullable=False, default="1.0")

    # JSON fields for complex data
    skill_proficiencies: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array
    strengths: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array
    weaknesses: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array
    learning_summary: Mapped[str | None] = mapped_column(Text, nullable=True) # Natural language heuristic summary
    learning_path: Mapped[str] = mapped_column(Text, nullable=False)  # JSON object array format

    # Relationships
    session: Mapped["AssessmentSession"] = relationship("AssessmentSession", back_populates="result")
    learner: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return f"<AssessmentResult(id={self.id}, proficiency={self.overall_proficiency})>"
