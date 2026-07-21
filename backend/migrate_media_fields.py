"""
Migration: add audio_url and image_url columns to questions table.
"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings


async def main():
    engine = create_async_engine(settings.DATABASE_URL, connect_args={"statement_cache_size": 0})
    async with engine.connect() as conn:
        await conn.execute(text(
            "ALTER TABLE questions ADD COLUMN IF NOT EXISTS audio_url TEXT"
        ))
        await conn.execute(text(
            "ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT"
        ))
        await conn.commit()
        print("Migration complete: added audio_url and image_url columns.")


if __name__ == "__main__":
    asyncio.run(main())
