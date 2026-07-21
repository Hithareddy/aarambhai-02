import asyncio
import os
import sys

from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base
# Import all models to ensure they are registered in the metadata before create_all
import app.models.learning

# Fix Windows asyncio issues
if sys.platform == 'win32':
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def migrate():
    """
    Creates new tables for the Learning Module Engine (Sprint 7).
    """
    print("Starting database migration for Sprint 7 (Learning Module Engine)...")
    
    async with engine.begin() as conn:
        try:
            print("Creating all newly registered tables...")
            await conn.run_sync(Base.metadata.create_all)
            print("Migration successful: Learning Engine models have been applied to the database.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
