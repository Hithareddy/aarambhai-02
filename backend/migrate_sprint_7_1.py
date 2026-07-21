import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.db.session import engine
from app.models.assessment import AssessmentBlueprint

# Fix Windows asyncio issues
if sys.platform == 'win32':
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def migrate_blueprints():
    print("Starting Blueprint length migration (Sprint 7.1)...")
    
    async with engine.begin() as conn:
        print("Updating legacy blueprints to 15 questions...")
        result = await conn.execute(
            update(AssessmentBlueprint).values(question_count=15)
        )
        print(f"Updated {result.rowcount} blueprints successfully.")

if __name__ == "__main__":
    asyncio.run(migrate_blueprints())
