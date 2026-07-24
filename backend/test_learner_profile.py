import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import uuid

# Re-use backend configuration where possible. 
# We'll just define the connection manually based on typical FastAPI asyncpg setups
from app.db.base import Base # To get models
from app.models.learner import LearnerProfile
from app.models.user import User
from app.core.config import settings

async def main():
    engine = create_async_engine(str(settings.DATABASE_URL).replace('postgresql://', 'postgresql+asyncpg://'))
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        print("Checking learner profile DB connection...")
        
        test_user = User(
            id=str(uuid.uuid4()),
            email=str(uuid.uuid4()) + "@test.com",
            hashed_password="test",
            full_name="Test User"
        )
        session.add(test_user)
        await session.commit()
        await session.refresh(test_user)
        
        test_profile = LearnerProfile(
            user_id=test_user.id,
            name="Test User",
            age_group="18-24",
            educational_background="Bachelors",
            current_role="Student",
            learning_goal="Job",
            learning_language="Telugu",
            current_familiarity="Beginner",
            digital_comfort="High",
            voice_preference="Female voice",
            speaking_speed="Slow"
        )
        session.add(test_profile)
        await session.commit()
        await session.refresh(test_profile)
        
        print(f"Successfully created: {test_profile.id}")
        print(f"Voice preference: {test_profile.voice_preference}")
        print(f"Speaking speed: {test_profile.speaking_speed}")

if __name__ == "__main__":
    asyncio.run(main())
