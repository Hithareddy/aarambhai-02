"""
Base model and database configuration.

Defines the base SQLAlchemy model with common fields and timestamp management.
"""
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """
    Base SQLAlchemy model for all database models.

    Provides common fields and functionality for all models.
    """

    pass


class TimestampMixin:
    """
    Mixin class for adding timestamp fields to models.

    Automatically manages created_at and updated_at timestamps.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


