import asyncio
import sys
from app.db.base import Base
from app.db.session import engine
from app.models.skill_profile import SkillProfile

# Fix Windows asyncio issues
if sys.platform == 'win32':
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def migrate_sprint_10():
    print("Starting database migration for Sprint 10...")
    try:
        async with engine.begin() as conn:
            print("Creating all newly registered tables (SkillProfile)...")
            await conn.run_sync(Base.metadata.create_all)
            print("Migration successful: Skill Profile models applied to the database.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate_sprint_10())
