"""
Database session management.

Configures async SQLAlchemy session factory with connection pooling.
"""
import re as _re

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Detect PgBouncer mode from the DATABASE_URL query string.
_using_pgbouncer = "pgbouncer=true" in settings.DATABASE_URL

# Strip the non-standard "pgbouncer=true" query-string parameter before
# handing the URL to SQLAlchemy/psycopg.  It is a Supabase/Prisma convention
# and is NOT a valid libpq connection option — psycopg rejects it.
_db_url = _re.sub(r"[?&]pgbouncer=true", "", settings.DATABASE_URL)

# Build engine kwargs.
_engine_kwargs: dict = dict(
    echo=settings.APP_DEBUG,
)

if _using_pgbouncer:
    # PgBouncer in transaction-pooling mode:
    #   - NullPool: let PgBouncer manage pooling, not SQLAlchemy.
    #   - prepare_threshold=0: disable psycopg prepared-statement caching
    #     because PgBouncer does not support prepared statements.
    #     This is passed through to psycopg.AsyncConnection.connect().
    _engine_kwargs["poolclass"] = NullPool
    _engine_kwargs["connect_args"] = {"prepare_threshold": None}
else:
    _engine_kwargs["pool_size"] = settings.DATABASE_POOL_SIZE
    _engine_kwargs["max_overflow"] = settings.DATABASE_MAX_OVERFLOW
    _engine_kwargs["pool_timeout"] = settings.DATABASE_POOL_TIMEOUT

# Create async engine
engine = create_async_engine(_db_url, **_engine_kwargs)

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
