"""
Migration script for Phase 2 Flexible Daily Learning Goal schema updates.
Adds:
- daily_goal_minutes column to learner_profiles (INTEGER DEFAULT 20 NOT NULL)
- goal_minutes column to learner_daily_activities (INTEGER DEFAULT 20 NOT NULL)
"""
import asyncio
import sys
from sqlalchemy import text

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import engine


async def run_migration():
    print("--- Running Phase 2 Schema Migration ---")
    async with engine.begin() as conn:
        # Add daily_goal_minutes to learner_profiles if not exists
        await conn.execute(
            text(
                "ALTER TABLE learner_profiles ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER DEFAULT 20 NOT NULL;"
            )
        )
        print("Updated learner_profiles table: added daily_goal_minutes.")

        # Add goal_minutes to learner_daily_activities if not exists
        await conn.execute(
            text(
                "ALTER TABLE learner_daily_activities ADD COLUMN IF NOT EXISTS goal_minutes INTEGER DEFAULT 20 NOT NULL;"
            )
        )
        print("Updated learner_daily_activities table: added goal_minutes.")

    print("--- Phase 2 Migration Completed Successfully ---")


if __name__ == "__main__":
    asyncio.run(run_migration())
