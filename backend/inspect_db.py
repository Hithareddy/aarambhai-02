import asyncio
import traceback
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def main():
    try:
        print(f"DATABASE_URL: {settings.DATABASE_URL}")
        # Add connect_args to bypass PgBouncer prepared statement error
        engine = create_async_engine(settings.DATABASE_URL, connect_args={"statement_cache_size": 0})
        async with engine.connect() as conn:
            res = await conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'learner_profiles';
            """))
            print("\nColumns in learner_profiles:")
            for row in res:
                print(f"  {row[0]}: {row[1]}")
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
