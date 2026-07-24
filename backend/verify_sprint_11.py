import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings

async def main():
    engine = create_async_engine(settings.DATABASE_URL, connect_args={"statement_cache_size": 0})
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with session_factory() as db:
        from app.services.practice_service import PracticeService
        from app.models.gamification import GamificationProfile
        print("====== 1. Fetching Today's Learning for Random Learner ======")
        service = PracticeService(db)
        
        # We assume learner with 'user_id' = 'some-offline-tester' or we fetch a real learner 
        from app.models.user import User
        from app.models.learner import LearnerProfile
        
        user_res = await db.execute(select(User).limit(3))
        users = user_res.scalars().all()
        
        if not users:
            print("No users in DB. Exiting.")
            return

        for u in users:
            print(f"\n--- Testing Learner ID: {u.id} ---")
            try:
                plan = await service.get_todays_learning(str(u.id))
                print(f"Context: {plan.module_context}")
                print(f"Total XP Possible: {plan.total_xp}")
                print(f"Total Activities: {len(plan.activities)}")
                for act in plan.activities:
                    print(f" - [{act.activity_type}] {act.title} (XP: {act.rewards.xp})")
            except Exception as e:
                print(f"Error fetching plan for user: {e}")
                
        print("\n====== 2. Simulating Gamification XP Accrual ======")
        target_user = users[0]
        
        prof_res = await db.execute(select(GamificationProfile).where(GamificationProfile.user_id == str(target_user.id)))
        prof = prof_res.scalars().first()
        
        if not prof:
            print("Creating mock gamification profile...")
            prof = GamificationProfile(user_id=str(target_user.id), xp=0, level=1, daily_streak_count=0)
            db.add(prof)
            await db.commit()
            
        print(f"Initial State -> XP: {prof.xp}, Level: {prof.level}, Streak: {prof.daily_streak_count}")
        
        # Simulate completing an activity
        prof.xp += 15
        prof.daily_streak_count += 1
        
        # Level thresholds logic mock (Wait, normally XP/level is driven by completion pipeline, let's just mock it here to verify db fields exist)
        if prof.xp >= 100:
            prof.level = 2
            
        await db.commit()
        await db.refresh(prof)
        print(f"Post Update State -> XP: {prof.xp}, Level: {prof.level}, Streak: {prof.daily_streak_count}")

if __name__ == "__main__":
    asyncio.run(main())
