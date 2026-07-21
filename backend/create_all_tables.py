import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.base import Base
from app.core.config import settings

# Import ALL models so that Base.metadata knows about them
from app.models.user import User
from app.models.assessment import AssessmentResult, AssessmentSession, AssessmentBlueprint
from app.models.learning import LearningModule, Lesson, LessonProgress, ModuleProgress
# Import any other models needed

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def create_tables():
    print(f"DATABASE_URL: {settings.DATABASE_URL}")
    engine = create_async_engine(settings.DATABASE_URL)
    
    async with engine.begin() as conn:
        print("Creating all tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("Done!")

if __name__ == "__main__":
    asyncio.run(create_tables())
