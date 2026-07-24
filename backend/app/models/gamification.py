import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin

class GamificationProfile(Base, TimestampMixin):
    __tablename__ = "gamification_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    
    # Progression
    xp = Column(Integer, default=0, nullable=False)
    level = Column(Integer, default=1, nullable=False)
    
    # Retention
    daily_streak_count = Column(Integer, default=0, nullable=False)
    last_active_date = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="gamification_profile")
    user_badges = relationship("UserBadge", back_populates="gamification_profile", cascade="all, delete-orphan")

class Badge(Base, TimestampMixin):
    """Configurable Badge Engine model (e.g. First Lesson, 3-Day Streak, Story Reader)."""
    __tablename__ = "badges"
    
    id = Column(String, primary_key=True, index=True) # string ID e.g., 'badge_streak_3'
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    
    # Categories: Learning, Speaking, Listening, Reading, Vocabulary, Consistency
    category = Column(String, nullable=False, index=True)
    
    # The image path or icon class for UI rendering
    icon_url = Column(String, nullable=True)
    
    # Logic configuration constraints (driven by Backend Evaluator)
    # E.g. {"metric": "streak", "threshold": 3} or {"metric": "game_score", "threshold": 100}
    criteria_rules = Column(JSONB, default=dict)
    
    is_active = Column(Boolean, default=True)

class UserBadge(Base, TimestampMixin):
    """Junction table recording when a user earned a badge."""
    __tablename__ = "user_badges"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    gamification_profile_id = Column(UUID(as_uuid=True), ForeignKey("gamification_profiles.id", ondelete="CASCADE"), index=True)
    badge_id = Column(String, ForeignKey("badges.id", ondelete="CASCADE"), index=True)
    
    earned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    gamification_profile = relationship("GamificationProfile", back_populates="user_badges")
    badge = relationship("Badge")
