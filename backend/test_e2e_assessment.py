import asyncio
import time
import uuid

from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.db.session import async_session_factory
from app.schemas.learner import LearnerProfileCreate
from app.services.learner_service import LearnerService
from app.schemas.assessment import AssessmentSessionCreate, AssessmentBlueprintCreate
from app.services.assessment_service import AssessmentService


async def e2e_test():
    print(f"Connecting to database: {settings.DATABASE_URL}")
    print("--- E2E VERIFICATION SCRIPT ---")
    
    # 1. Create Senior Citizen Profile
    senior_id = str(uuid.uuid4())
    student_id = str(uuid.uuid4())

    async with async_session_factory() as db:
        from app.services.user_service import UserService
        from app.schemas.user import UserCreate
        user_service = UserService(db)
        
        senior_user = await user_service.create_user(UserCreate(email=f"senior_{senior_id[:8]}@test.com", password="Password123!", full_name="Senior Tester"))
        student_user = await user_service.create_user(UserCreate(email=f"student_{student_id[:8]}@test.com", password="Password123!", full_name="Student Tester"))
        senior_id = senior_user.id
        student_id = student_user.id

        learner_service = LearnerService(db)
        assess_service = AssessmentService(db)
        
        # Build Senior
        print("\n[Senior Citizen] Building profile...")
        await learner_service.create_learner_profile(LearnerProfileCreate(
            name="Senior Tester",
            age_group="60+",
            educational_background="Primary school",
            current_role="Senior citizen",
            learning_goal="Everyday English",
            learning_language="en",
            website_language="te",
            current_familiarity="Complete beginner",
            digital_comfort="This is my first time"
        ), senior_id)

        print("[Student] Building profile...")
        await learner_service.create_learner_profile(LearnerProfileCreate(
            name="Student Tester",
            age_group="18 - 25",
            educational_background="College",
            current_role="Student",
            learning_goal="Career skills",
            learning_language="en",
            website_language="en",
            current_familiarity="I'm comfortable",
            digital_comfort="Very comfortable"
        ), student_id)

        # 2. Generate Blueprints and Start Sessions (Time tracking)
        t0 = time.time()
        senior_blueprint = await assess_service.generate_blueprint(AssessmentBlueprintCreate(
            learning_goal="Everyday English",
            question_count=15,
            min_difficulty=1,
            max_difficulty=5,
            estimated_duration_minutes=15,
            domains=["Listening", "Speaking", "Vocabulary"],
            skills=["listening", "speaking", "vocabulary"],
            question_distribution={}
        ), senior_id)
        senior_session = await assess_service.create_session(AssessmentSessionCreate(), senior_id)
        t1 = time.time()
        
        print(f"\n[Senior Citizen] Blueprint & Session Load Latency: {(t1 - t0)*1000:.2f}ms")
        print(f"   Priority Domains: {senior_blueprint.domains}")
        print(f"   Max Difficulty: {senior_blueprint.max_difficulty}")
        print(f"   Question Count Target: {senior_blueprint.question_count}")
        
        print("\n[Senior Citizen] Fetching 3 questions sequentially to mimic transitions...")
        for i in range(3):
            t_fetch_start = time.time()
            q = await assess_service.get_next_question(senior_session.id, senior_id)
            t_fetch_end = time.time()
            print(f"   Q{i+1}: {(t_fetch_end - t_fetch_start)*1000:.2f}ms | Skill: {q['skill']} | Diff: {q['difficulty']}")
            # Mock answering to progress adaptive logic
            from app.schemas.assessment import QuestionResponseCreate
            await assess_service.submit_response(senior_session.id, QuestionResponseCreate(
                question_id=str(q["id"]),
                selected_answer="A",
                response_time_seconds=10
            ), senior_id)

        t0 = time.time()
        student_blueprint = await assess_service.generate_blueprint(AssessmentBlueprintCreate(
            learning_goal="Career skills",
            question_count=15,
            min_difficulty=2,
            max_difficulty=5,
            estimated_duration_minutes=15,
            domains=["Reading", "Writing", "Grammar"],
            skills=["reading", "writing", "grammar"],
            question_distribution={}
        ), student_id)
        student_session = await assess_service.create_session(AssessmentSessionCreate(), student_id)
        t1 = time.time()

        print(f"\n[Student / Career] Blueprint & Session Load Latency: {(t1 - t0)*1000:.2f}ms")
        print(f"   Priority Domains: {student_blueprint.domains}")
        print(f"   Max Difficulty: {student_blueprint.max_difficulty}")
        print(f"   Question Count Target: {student_blueprint.question_count}")
        
        print("\n[Student / Career] Fetching 3 questions sequentially to mimic transitions...")
        for i in range(3):
            t_fetch_start = time.time()
            q = await assess_service.get_next_question(student_session.id, student_id)
            t_fetch_end = time.time()
            print(f"   Q{i+1}: {(t_fetch_end - t_fetch_start)*1000:.2f}ms | Skill: {q['skill']} | Diff: {q['difficulty']}")
            from app.schemas.assessment import QuestionResponseCreate
            await assess_service.submit_response(student_session.id, QuestionResponseCreate(
                question_id=str(q["id"]),
                selected_answer="A",
                response_time_seconds=10
            ), student_id)


if __name__ == "__main__":
    import sys
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(e2e_test())
