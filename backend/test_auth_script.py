import asyncio
from app.db.session import async_session_factory
from app.services.user_service import UserService

async def test():
    try:
        async with async_session_factory() as db:
            service = UserService(db)
            user = await service.authenticate_user("learner@example.com", "password123")
            print("Successfully authenticated as:", user.email if user else None)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
