import asyncio
import traceback
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def main():
    try:
        print(f"DATABASE_URL: {settings.DATABASE_URL}")
        engine = create_async_engine(settings.DATABASE_URL, connect_args={"statement_cache_size": 0})
        async with engine.connect() as conn:
            await conn.execute(text("""
                ALTER TABLE learner_profiles 
                ADD COLUMN IF NOT EXISTS website_language VARCHAR(10) DEFAULT 'en' NOT NULL;
            """))
            await conn.commit()
            print("Migration applied successfully: website_language column added to learner_profiles (or already exists).")
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
