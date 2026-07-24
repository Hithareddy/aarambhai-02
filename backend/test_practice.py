import asyncio
from app.db.session import async_session_factory
from app.services.practice_service import PracticeService
from uuid import UUID

async def test_practice():
    # User ID for learner@example.com is generally UUID. Since we got None earlier, 
    # let's just fetch the first user to run the practice engine!
    async with async_session_factory() as db:
        from sqlalchemy import select
        from app.models.user import User
        users = await db.execute(select(User))
        first_user = users.scalars().first()
        if not first_user:
            print("No users in DB!")
            return
            
        print(f"Running practice engine for {first_user.email} (ID: {first_user.id})...")
        
        service = PracticeService(db)
        plan = await service.get_todays_learning_plan(first_user.id)
        
        print("\n=== Today's Learning Plan ===")
        print(f"Time: {plan.estimated_time}")
        print(f"XP: {plan.total_xp}")
        print(f"Context: {plan.module_context}")
        print(f"Total Activities: {len(plan.activities)}")
        
        for i, act in enumerate(plan.activities):
            print(f" [{i+1}] {act.activity_type} - {act.title} (Module: {act.module_id}, Lesson: {act.lesson_id})")

if __name__ == "__main__":
    asyncio.run(test_practice())
