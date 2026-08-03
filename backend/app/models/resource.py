import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Resource(Base):
    """
    Curated Educational Resource Model.
    Supports Cheat Sheets, Articles, Worksheets, and Video Lessons.
    """
    __tablename__ = "resources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # article | cheat_sheet | worksheet | video
    category = Column(String(100), nullable=False)  # Study Guide | Grammar | Vocabulary | Speaking | Listening
    description = Column(Text, nullable=False)
    content = Column(Text, nullable=True)  # Markdown / HTML content for articles & cheat sheets
    youtube_id = Column(String(100), nullable=True)  # Real YouTube Video ID
    video_channel = Column(String(100), nullable=True)  # Channel Name (e.g., BBC Learning English)
    duration = Column(String(50), nullable=False)  # e.g., "5 min read", "8 min video", "PDF Download"
    download_url = Column(Text, nullable=True)  # Download / Printable payload or URL
    recommended_skill = Column(String(100), nullable=True)  # speaking | listening | reading | writing | grammar | vocabulary
    target_language = Column(String(20), nullable=False, default="en")  # en | te | hi
    age_groups = Column(String(100), nullable=True, default="all")  # child | student | pro | senior | all
    difficulty_level = Column(String(20), nullable=False, default="beginner")  # beginner | intermediate | advanced
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    bookmarks = relationship("ResourceBookmark", back_populates="resource", cascade="all, delete-orphan")


class ResourceBookmark(Base):
    """Learner saved/bookmarked resources."""
    __tablename__ = "resource_bookmarks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(String(36), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    resource = relationship("Resource", back_populates="bookmarks")
