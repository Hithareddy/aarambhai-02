import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped

from app.db.base import Base, TimestampMixin

class LearningModule(Base, TimestampMixin):
    __tablename__ = "learning_modules"
    
    id = Column(String, primary_key=True, index=True) # e.g. "module_vocab_1"
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    skill = Column(String, index=True, nullable=False)
    difficulty = Column(Integer, default=1)
    estimated_duration = Column(Integer, default=15)
    prerequisites = Column(JSONB, default=list) 
    order = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    
    # CMS / Lifecycle Versioning
    version = Column(String, default="1.0.0")
    status = Column(String, default="Draft") # Draft, Published, Archived
    published_at = Column(DateTime(timezone=True), nullable=True)

    lessons = relationship("Lesson", back_populates="module", order_by="Lesson.order")
    progress = relationship("ModuleProgress", back_populates="module", cascade="all, delete-orphan")

class Lesson(Base, TimestampMixin):
    __tablename__ = "lessons"
    
    id = Column(String, primary_key=True, index=True) # e.g. "lesson_vocab_1_1"
    module_id = Column(String, ForeignKey("learning_modules.id", ondelete="CASCADE"), index=True)
    title = Column(String, nullable=False)
    lesson_type = Column(String, default="learning") # learning, practice, quiz, revision, conversation, pronunciation
    schema_version = Column(String, default="v1")
    content_blocks = Column(JSONB, default=list)
    completion_criteria = Column(JSONB, default=dict) 
    order = Column(Integer, default=1)
    
    # CMS / Lifecycle Versioning
    version = Column(String, default="1.0.0")
    status = Column(String, default="Draft") # Draft, Published, Archived
    published_at = Column(DateTime(timezone=True), nullable=True)

    module = relationship("LearningModule", back_populates="lessons")
    activities = relationship("LearningActivity", back_populates="lesson", order_by="LearningActivity.order")
    progress = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")

class LessonProgress(Base, TimestampMixin):
    __tablename__ = "lesson_progress"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    lesson_id = Column(String, ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    
    status = Column(String, default="not_started") # not_started, in_progress, completed
    progress_percentage = Column(Float, default=0.0)
    score = Column(Float, nullable=True) 
    
    started_at = Column(DateTime(timezone=True), nullable=True)
    last_accessed_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    time_spent_seconds = Column(Integer, default=0)

    lesson = relationship("Lesson", back_populates="progress")

class ModuleProgress(Base, TimestampMixin):
    __tablename__ = "module_progress"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    module_id = Column(String, ForeignKey("learning_modules.id", ondelete="CASCADE"), index=True)
    
    progress_percentage = Column(Float, default=0.0)
    completed_lessons_count = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    module = relationship("LearningModule", back_populates="progress")

class LearningActivity(Base, TimestampMixin):
    __tablename__ = "learning_activities"
    
    id = Column(String, primary_key=True, index=True) # e.g. "act_vocab_match_1"
    module_id = Column(String, ForeignKey("learning_modules.id", ondelete="CASCADE"), index=True)
    lesson_id = Column(String, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=True, index=True)
    
    activity_type = Column(String, nullable=False, index=True) # vocabulary_match, sentence_builder, crossword, etc.
    title = Column(String, nullable=False)
    order = Column(Integer, default=1)
    
    # Unified API standard payload blobs
    metadata_fields = Column(JSONB, default=dict) # estimated_duration, target_skill, difficulty_level, supported_languages
    content = Column(JSONB, default=dict)         # Specific to activity_type
    adaptive_settings = Column(JSONB, default=dict)
    rewards = Column(JSONB, default=dict)
    
    # CMS / Lifecycle Versioning
    version = Column(String, default="1.0.0")
    status = Column(String, default="Draft")
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    lesson = relationship("Lesson", back_populates="activities")
    analytics = relationship("ActivityAnalytics", back_populates="activity")
    sessions = relationship("ActivitySession", back_populates="activity")

class ActivitySession(Base, TimestampMixin):
    __tablename__ = "activity_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    activity_id = Column(String, ForeignKey("learning_activities.id", ondelete="CASCADE"), index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    # Execution metrics
    score = Column(Float, default=0.0)
    accuracy = Column(Float, default=0.0)
    attempts = Column(Integer, default=1)
    hint_usage_count = Column(Integer, default=0)
    time_spent_seconds = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Gamification outcome
    xp_earned = Column(Integer, default=0)
    mastery_gain = Column(Float, default=0.0)
    
    activity = relationship("LearningActivity", back_populates="sessions")

class ActivityAnalytics(Base, TimestampMixin):
    __tablename__ = "activity_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    activity_id = Column(String, ForeignKey("learning_activities.id", ondelete="CASCADE"), unique=True)
    
    # Aggregated metrics for ML/Analytics Engine
    completion_rate = Column(Float, default=0.0)
    average_completion_time = Column(Float, default=0.0)
    average_accuracy = Column(Float, default=0.0)
    average_attempts = Column(Float, default=0.0)
    average_hint_usage = Column(Float, default=0.0)
    abandonment_rate = Column(Float, default=0.0)
    
    activity = relationship("LearningActivity", back_populates="analytics")
