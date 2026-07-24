import asyncio
from app.db.session import engine
from sqlalchemy import text

async def main():
    async with engine.connect() as conn:
        res = await conn.execute(text('SELECT COUNT(*) FROM questions WHERE proficiency_level IS NULL'))
        print('Questions with NULL proficiency_level:', res.scalar())

asyncio.run(main())
