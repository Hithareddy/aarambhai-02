import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import ForeignKey, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class TutorConversation(Base, TimestampMixin):
    """
    Tutor conversation session.
    """
    __tablename__ = "tutor_conversations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    tutor_name: Mapped[str] = mapped_column(String(100), nullable=False, default="Mira")
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Practice Session")

    # Relationships
    messages: Mapped[List["TutorMessage"]] = relationship(
        "TutorMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="TutorMessage.created_at"
    )

    def __repr__(self) -> str:
        return f"<TutorConversation(id={self.id}, user_id={self.user_id}, title={self.title})>"


class TutorMessage(Base):
    """
    Tutor message item within a conversation.
    """
    __tablename__ = "tutor_messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    conversation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tutor_conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False) # 'learner' or 'tutor'
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    conversation: Mapped["TutorConversation"] = relationship("TutorConversation", back_populates="messages")

    def __repr__(self) -> str:
        return f"<TutorMessage(id={self.id}, role={self.role}, content={self.content[:20]}...)>"
