"""
Announcement model for system broadcasts.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Announcement(Base, TimestampMixin):
    """
    Announcement model for system-wide broadcasts displayed on learner dashboards.
    """
    __tablename__ = "announcements"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        comment="Unique identifier (UUID)",
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Announcement headline title",
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Broadcast body text",
    )
    target_audience: Mapped[str] = mapped_column(
        String(50),
        default="all",
        nullable=False,
        comment="Target audience filter (all, beginners, advanced)",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Active visibility flag",
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Optional expiration timestamp",
    )
