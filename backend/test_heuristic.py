import asyncio
import sys
from app.db.session import engine
from app.services.assessment_service import AssessmentService
from app.schemas.assessment import QuestionResponseCreate
from app.models.assessment import AssessmentSession
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

# Fix Windows asyncio issues
if sys.platform == 'win32':
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def run_test():
    async with engine.begin() as conn:
        print("Starting manual mapping test...")
    
if __name__ == "__main__":
    asyncio.run(run_test())
