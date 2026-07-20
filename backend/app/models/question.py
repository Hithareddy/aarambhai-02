"""
Question bank models for storing assessment questions.

Stores questions, options, and metadata for the adaptive assessment system.
"""
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    pass


class Question(Base, TimestampMixin):
    """
    Question model.

    Stores individual assessment questions with metadata for adaptive selection.
    """

    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    # Classification
    learning_goal: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    domain: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    skill: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    difficulty: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # 1-5

    # Question Content
    question_type: Mapped[str] = mapped_column(String(50), nullable=False)  # mcq, true_false, etc.
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")

    # Question text and options (stored as JSON)
    question_content: Mapped[str] = mapped_column(Text, nullable=False)  # JSON object
    options: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)  # JSON value

    # Assessment Parameters
    discrimination_index: Mapped[float] = mapped_column(nullable=True)  # IRT parameter
    difficulty_parameter: Mapped[float] = mapped_column(nullable=True)  # IRT parameter
    guessing_parameter: Mapped[float] = mapped_column(nullable=True)  # IRT parameter

    # Metadata
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    tags: Mapped[str] = mapped_column(Text, nullable=True)  # JSON array

    def __repr__(self) -> str:
        return f"<Question(id={self.id}, skill={self.skill}, difficulty={self.difficulty})>"
