import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select, text
from app.db.session import async_session_factory
from app.models.question import Question

async def inspect_db():
    async with async_session_factory() as session:
        # Raw query
        res = await session.execute(text("SELECT id, is_active, skill, difficulty FROM questions WHERE id IN ('L001', 'S001', 'R001', 'W001', 'C001')"))
        rows = res.fetchall()
        print("Raw query rows:", rows)

        # Count with text query
        count_res = await session.execute(text("SELECT count(*) FROM questions WHERE is_active = true"))
        active_count = count_res.scalar()
        print("Active count with text query:", active_count)

        count_inactive = await session.execute(text("SELECT count(*) FROM questions WHERE is_active = false"))
        inactive_count = count_inactive.scalar()
        print("Inactive count with text query:", inactive_count)

if __name__ == "__main__":
    asyncio.run(inspect_db())
