"""
Database session management.

Configures async SQLAlchemy session factory with connection pooling.
"""
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# Create async engine with connection pooling
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
    echo=settings.APP_DEBUG,
    connect_args={
        "statement_cache_size": 0,
    },
)

# Create async session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncSession:
    """
    Get a database session.

    Yields an async session and ensures proper cleanup.

    Yields:
        AsyncSession: Database session
    """
    async with async_session_factory() as session:
        yield session


async def init_db() -> None:
    """
    Initialize database connection.

    Creates database tables if they don't exist.
    Note: In production, use Alembic migrations instead.
    """
    # Import all models to ensure they're registered with SQLAlchemy
    from app.models import user, learner, assessment, question, translation  # noqa: F401

    async with engine.begin() as conn:
        # Import Base here to create all tables
        from app.db.base import Base

        await conn.run_sync(Base.metadata.create_all)
