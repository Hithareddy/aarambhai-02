import asyncio
import os
import sys

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

# This script manually adds the new speaking assessment columns to the 'questions' table
# if they don't already exist.

async def migrate():
    # Use config database URL directly
    db_url = settings.DATABASE_URL
    if not db_url:
        print("Error: DATABASE_URL environment variable is not set")
        sys.exit(1)
        
    print(f"DATABASE_URL: {db_url}")
    
    engine = create_async_engine(db_url, echo=True)
    
    async with engine.begin() as conn:
        print("Checking if reference_text column exists...", flush=True)
        
        try:
            # Try to add reference_text
            await conn.execute(text("ALTER TABLE questions ADD COLUMN reference_text TEXT;"))
            print("Added reference_text column.", flush=True)
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("reference_text column already exists.", flush=True)
            else:
                print(f"An error occurred while adding reference_text: {e}", flush=True)
                
        try:
            # Try to add expected_keywords
            await conn.execute(text("ALTER TABLE questions ADD COLUMN expected_keywords TEXT;"))
            print("Added expected_keywords column.", flush=True)
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("expected_keywords column already exists.", flush=True)
            else:
                print(f"An error occurred while adding expected_keywords: {e}", flush=True)
                
        try:
            # Try to add max_duration_seconds
            await conn.execute(text("ALTER TABLE questions ADD COLUMN max_duration_seconds INTEGER DEFAULT 30 NOT NULL;"))
            print("Added max_duration_seconds column.", flush=True)
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("max_duration_seconds column already exists.", flush=True)
            else:
                print(f"An error occurred while adding max_duration_seconds: {e}", flush=True)

        try:
            # Try to add language_code
            await conn.execute(text("ALTER TABLE questions ADD COLUMN language_code VARCHAR(20) DEFAULT 'en-IN';"))
            print("Added language_code column.", flush=True)
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("language_code column already exists.", flush=True)
            else:
                print(f"An error occurred while adding language_code: {e}", flush=True)

    print("Migration complete!")
    await engine.dispose()

if __name__ == "__main__":
    # Handle event loop for Windows (important for Postgres async pg driver)
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    asyncio.run(migrate())
