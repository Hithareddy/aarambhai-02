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

    module = relationship("LearningModule", back_populates="lessons")
    progress = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")

class LessonProgress(Base, TimestampMixin):
    __tablename__ = "lesson_progress"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
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
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    module_id = Column(String, ForeignKey("learning_modules.id", ondelete="CASCADE"), index=True)
    
    progress_percentage = Column(Float, default=0.0)
    completed_lessons_count = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    module = relationship("LearningModule", back_populates="progress")
