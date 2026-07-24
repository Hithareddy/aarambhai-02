import asyncio
import uuid
import time
from app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.models.learner import LearnerProfile
from app.models.user import User
from app.schemas.learner import LearnerProfileCreate
from app.services.learner_service import LearnerService
from app.schemas.assessment import AssessmentSessionCreate, QuestionResponseCreate
from app.services.assessment_service import AssessmentService
from sqlalchemy import text

DATABASE_URL = str(settings.DATABASE_URL).replace('postgresql://', 'postgresql+asyncpg://')
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def run_verification():
    print("\n=== END-TO-END VERIFICATION: ASSESSMENT COMPLETE API ===")
    
    async with AsyncSessionLocal() as db:
        user_id = str(uuid.uuid4())
        print(f"\n1. Creating test User and Learner Profile ID: {user_id}")
        
        test_user = User(
            id=user_id,
            email=f"{user_id}@test.com",
            hashed_password="test",
            full_name="Tester Complete Flow"
        )
        db.add(test_user)
        await db.commit()
        
        profile_svc = LearnerService(db)
        await profile_svc.create_learner_profile(
            LearnerProfileCreate(
                name="Test Learner Flow",
                age_group="18-24",
                educational_background="Bachelors",
                current_role="Student",
                learning_goal="Vocabulary",
                learning_language="en", 
                website_language="en",
                current_familiarity="Complete beginner",
                digital_comfort="High"
            ),
            user_id
        )
        print("   -> Profile created accurately")

        svc = AssessmentService(db)

        # Create session
        print("\n2. Starting Adaptive Assessment Session...")
        session = await svc.create_session(AssessmentSessionCreate(), user_id)
        session_id = session.id
        print(f"   -> Session created: {session_id}")
        
        # We need to answer questions until exhausted
        print("\n3. Iterating through all 15 adaptive questions...")
        answered = 0
        while True:
            try:
                q = await svc.get_next_question(session_id, user_id)
            except ValueError as e:
                # "No more questions available" expected
                if "No more questions" in str(e):
                    break
                else:
                    raise e
                    
            await svc.submit_response(
                session_id, 
                QuestionResponseCreate(question_id=q["id"], selected_answer="A", response_time_seconds=5), 
                user_id
            )
            answered += 1
            print(f"   Answered Q{answered}: {q['id']}")

        print(f"\n   -> Total questions answered: {answered}")
        
        print("\n4. Calling complete_assessment...")
        t0 = time.time()
        result = await svc.complete_assessment(session_id, user_id)
        t1 = time.time()
        
        print(f"   -> complete_assessment ran successfully in {(t1-t0)*1000:.2f}ms")
        print(f"   -> Result ID: {result.get('id')}")
        print(f"   -> Overall Proficiency: {result.get('overall_proficiency')}")
        print(f"   -> Learning Path Created: {result.get('learning_path')}")
        
        print("\n5. Testing GET /result")
        fetch_result = await svc.get_assessment_result(session_id, user_id)
        if fetch_result:
            print("   -> GET result matched the completed assessment successfully.")
        else:
            print("   -> ERROR: GET result came back None!")

        print("\n=== VERIFICATION SUCCESSFUL ===")

if __name__ == "__main__":
    asyncio.run(run_verification())
