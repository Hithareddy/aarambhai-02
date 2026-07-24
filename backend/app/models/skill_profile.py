import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User

class SkillProfile(Base, TimestampMixin):
    """
    Tracks dynamic proficiency and mastery scores for a specific language skill.
    """
    __tablename__ = "skill_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    # "vocabulary", "grammar", "reading", "writing", "listening", "speaking"
    skill = Column(String, index=True, nullable=False)
    
    current_level = Column(Integer, default=1)
    
    # 0.0 to 100.0, determines UI stars or confidence rings
    mastery_percentage = Column(Float, default=0.0)
    
    # Arbitrary heuristic counter allowing the engine to adapt faster based on hint usage/mistakes
    confidence_score = Column(Float, default=0.0)
    
    last_updated = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="skill_profiles")
