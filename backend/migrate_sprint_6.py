import asyncio
import os
import sys
from sqlalchemy import text
from app.db.session import engine

# Fix Windows asyncio issues
if sys.platform == 'win32':
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def migrate():
    """
    Adds learning_summary and assessment_version to assessment_results.
    """
    print("Starting database migration for Sprint 6...")
    async with engine.begin() as conn:
        try:
            print("Adding learning_summary column...")
            await conn.execute(text(
                "ALTER TABLE assessment_results ADD COLUMN IF NOT EXISTS learning_summary TEXT"
            ))
            print("Adding assessment_version column...")
            await conn.execute(text(
                "ALTER TABLE assessment_results ADD COLUMN IF NOT EXISTS assessment_version VARCHAR(20) DEFAULT '1.0' NOT NULL"
            ))

            print("Migration successful: Added Sprint 6 Insight columns to assessment_results table.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
