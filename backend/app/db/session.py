"""
Database session management.

Configures async SQLAlchemy session factory with connection pooling.
"""
import asyncio
import sys
import re as _re

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.core.config import settings

_raw_url = settings.DATABASE_URL or "sqlite+aiosqlite:///./aarambh_local.db"


def _build_engine(url_str: str):
    if "sqlite" in url_str:
        if url_str.startswith("sqlite://"):
            url_str = url_str.replace("sqlite://", "sqlite+aiosqlite://", 1)
        return create_async_engine(
            url_str,
            echo=settings.APP_DEBUG,
            connect_args={"check_same_thread": False}
        )

    # Supabase's transaction-mode pooler (port 6543 / *.pooler.supabase.com)
    # multiplexes many clients over few server connections, so a server-side
    # prepared statement created by one request can collide with another
    # ("prepared statement _pg3_0 already exists"). Detect it from the flag,
    # the pooler host, or the pooler port — not just the explicit flag.
    _using_pgbouncer = (
        "pgbouncer=true" in url_str
        or "pooler.supabase.com" in url_str
        or ":6543" in url_str
    )
    if url_str.startswith("postgres://"):
        url_str = url_str.replace("postgres://", "postgresql+psycopg://", 1)
    elif url_str.startswith("postgresql://") and not url_str.startswith("postgresql+"):
        url_str = url_str.replace("postgresql://", "postgresql+psycopg://", 1)

    _db_url = _re.sub(r"[?&]pgbouncer=true", "", url_str)

    _engine_kwargs: dict = dict(
        echo=settings.APP_DEBUG,
    )

    # Disabling prepared statements is always safe with psycopg3 and is the
    # only reliable fix behind a transaction pooler.
    _connect_args: dict = {"prepare_threshold": None}

    if _using_pgbouncer:
        # No client-side pooling on top of the server-side pooler, and never
        # reuse a cached statement name across multiplexed connections.
        _engine_kwargs["poolclass"] = NullPool
        _connect_args["prepare_threshold"] = None
    else:
        _engine_kwargs["pool_size"] = settings.DATABASE_POOL_SIZE
        _engine_kwargs["max_overflow"] = settings.DATABASE_MAX_OVERFLOW
        _engine_kwargs["pool_timeout"] = settings.DATABASE_POOL_TIMEOUT
        _engine_kwargs["pool_pre_ping"] = True

    _engine_kwargs["connect_args"] = _connect_args

    return create_async_engine(_db_url, **_engine_kwargs)


# Create async engine
engine = _build_engine(_raw_url)

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

    Creates database tables if they don't exist and falls back to local SQLite if remote DB is unreachable.
    Also ensures the certified assessment catalogue is seeded.
    """
    global engine, async_session_factory

    # Import all models to ensure they're registered with SQLAlchemy
    from app.models import user, learner, assessment, question, translation  # noqa: F401
    from app.db.base import Base

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"PostgreSQL connection failed ({e}). Falling back to local SQLite database (aarambh_local.db)...")
        fallback_url = "sqlite+aiosqlite:///./aarambh_local.db"
        engine = _build_engine(fallback_url)
        async_session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    # Seed certified questions and curriculum modules if database is empty
    try:
        from sqlalchemy import select, func
        from app.models.question import Question
        from app.models.learning import LearningModule
        async with async_session_factory() as session:
            q_count = await session.scalar(select(func.count(Question.id)))
            if not q_count or q_count == 0:
                print("Seeding certified assessment question catalogue...")
                from seed_certified_v5_catalogue import seed_certified_catalogue
                await seed_certified_catalogue()

            m_count = await session.scalar(select(func.count(LearningModule.id)))
            if not m_count or m_count == 0:
                print("Seeding learning curriculum modules...")
                from seed_sprint_9a import seed_9a
                await seed_9a()
    except Exception as seed_err:
        print(f"Notice: Database auto-seeding status: {seed_err}")
