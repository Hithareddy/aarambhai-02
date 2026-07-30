import asyncio
import sys
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.user import User

async def promote_user(email: str):
    print(f"Connecting to database to promote user: {email}...")
    async with async_session_factory() as db:
        res = await db.execute(select(User).where(User.email == email))
        user = res.scalar_one_or_none()
        
        if not user:
            print(f"Error: User with email '{email}' not found.")
            return False
            
        if user.is_superuser:
            print(f"User '{email}' is ALREADY an administrator.")
            return True
            
        user.is_superuser = True
        await db.commit()
        print(f"SUCCESS: User '{email}' has been promoted to Administrator (is_superuser = True).")
        return True

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    if len(sys.argv) > 1:
        email = sys.argv[1]
    else:
        email = input("Enter user email to promote: ").strip()
        
    if not email:
        print("No email provided. Exiting.")
        sys.exit(1)
        
    success = asyncio.run(promote_user(email))
    sys.exit(0 if success else 1)
