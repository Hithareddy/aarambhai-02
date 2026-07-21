"""
Model for multilingual content translations.
Supports translating fields for questions, lessons, vocabulary, stories, etc.
"""
import uuid

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class ContentTranslation(Base, TimestampMixin):
    """
    Content translation model.
    Stores translated fields in a JSON structure keyed by entity type and ID.
    """

    __tablename__ = "content_translations"

    id: Mapped[uuid.UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    language_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)

    # JSON object storing all translated fields
    translated_fields: Mapped[str] = mapped_column(Text, nullable=False)

    def __repr__(self) -> str:
        return f"<ContentTranslation(id={self.id}, entity={self.entity_type}:{self.entity_id}, lang={self.language_code})>"
