import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.base import Base
from app.core.config import settings

# Import ALL models so that Base.metadata knows about them
from app.models.user import User
from app.models.assessment import AssessmentResult, AssessmentSession, AssessmentBlueprint
from app.models.learning import LearningModule, Lesson, LessonProgress, ModuleProgress
from app.models.activity import LearnerDailyActivity

from app.db.session import engine

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def create_tables():
    async with engine.begin() as conn:
        print("Creating all tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Done!")

if __name__ == "__main__":
    asyncio.run(create_tables())
