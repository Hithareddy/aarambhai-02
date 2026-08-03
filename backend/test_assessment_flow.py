import asyncio
import sys
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import async_session_factory, init_db
from app.models.user import User
from app.models.learner import LearnerProfile
from app.models.assessment import AssessmentBlueprint, AssessmentSession, AssessmentResult
from app.models.question import Question
from app.services.learner_service import LearnerService
from app.services.assessment_service import AssessmentService
from app.schemas.learner import LearnerProfileCreate
from app.schemas.assessment import AssessmentBlueprintCreate, AssessmentSessionCreate, QuestionResponseCreate

AsyncSessionLocal = async_session_factory


async def test_flow():
    print("--- Starting End-to-End Assessment Flow Test ---")
    await init_db()
    async with async_session_factory() as db:
        # 1. Setup a test user if not exists
        user_id = "test-user-id-999"
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                id=user_id,
                email="test_adaptive@example.com",
                full_name="Test User Name",
                hashed_password="some_hashed_password",
                is_active=True
            )
            db.add(user)
            await db.commit()
            print("Created test user.")
        else:
            print("Test user already exists.")

        # Delete any old profile, sessions, blueprint, results for an isolated test
        profiles = (await db.execute(select(LearnerProfile).where(LearnerProfile.user_id == user_id))).scalars().all()
        for p in profiles:
            await db.delete(p)
            
        sessions = (await db.execute(select(AssessmentSession).where(AssessmentSession.learner_id == user_id))).scalars().all()
        for s in sessions:
            results = (await db.execute(select(AssessmentResult).where(AssessmentResult.session_id == s.id))).scalars().all()
            for r in results:
                await db.delete(r)
            await db.delete(s)
            
        await db.commit()
        print("Cleaned up old test data.")

        # 2. Onboard user: Create Learner Profile
        learner_service = LearnerService(db)
        profile_data = LearnerProfileCreate(
            name="Alice Tester",
            age_group="26 – 45",
            educational_background="College",
            current_role="Working professional",
            learning_goal="Everyday English",
            learning_language="en",
            current_familiarity="I know a little",
            digital_comfort="Very comfortable"
        )
        profile = await learner_service.create_learner_profile(profile_data, user_id)
        assert profile is not None
        print(f"Learner Profile created for: {profile.name}")

        # 3. Analyze Profile
        analysis = await learner_service.analyze_profile(user_id)
        print(f"Profile Analysis results:")
        print(f"   Complexity Score: {analysis['complexity_score']}")
        print(f"   Priority Domains: {analysis['priority_domains']}")
        print(f"   Priority Skills: {analysis['priority_skills']}")
        print(f"   Min/Max Difficulty: {analysis['min_difficulty']}/{analysis['max_difficulty']}")
        print(f"   Expected Q Count: {analysis['question_count']}")
        
        # Assertions
        assert analysis['complexity_score'] > 0
        assert "Reading" in analysis['priority_domains']

        # 4. Generate Blueprint
        assessment_service = AssessmentService(db)
        blueprint_create = AssessmentBlueprintCreate(
            learning_goal=profile.learning_goal,
            question_count=analysis['question_count'],
            min_difficulty=analysis['min_difficulty'],
            max_difficulty=analysis['max_difficulty'],
            estimated_duration_minutes=analysis['estimated_duration_minutes'],
            domains=analysis['priority_domains'],
            skills=analysis['priority_skills'],
            question_distribution={}
        )
        blueprint = await assessment_service.generate_blueprint(blueprint_create, user_id)
        print(f"Blueprint generated successfully. ID: {blueprint.id}")
        
        # 5. Create Assessment Session
        session_create = AssessmentSessionCreate(
            blueprint_id=str(blueprint.id)
        )
        session = await assessment_service.create_session(session_create, user_id)
        db_session_id = str(session.id)
        print(f"Session started. ID: {db_session_id}, starting difficulty: {session.current_difficulty}")
        assert session.status == "in_progress"

        # 6. Walk through the questions adaptively
        count = 0
        while True:
            try:
                question_payload = await assessment_service.get_next_question(db_session_id, user_id)
                count += 1
                q_id = str(question_payload["id"])
                difficulty = question_payload["difficulty"]
                skill = question_payload["skill"]
                domain = question_payload["domain"]
                print(f"Question {count}: {q_id} | Domain: {domain} | Skill: {skill} | Difficulty: {difficulty}")
                
                # Fetch full question to get options & correct answer
                q_obj = await db.get(Question, q_id)
                assert q_obj is not None
                correct_answer_str = q_obj.correct_answer
                # Deserialize
                correct_answer = json.loads(correct_answer_str)
                
                # Alternate answers to test difficulty updates (correct vs incorrect)
                # First correct, second correct, then incorrect, etc.
                selected_answer = correct_answer
                is_simulate_correct = True
                if count in (3, 6):
                    selected_answer = "wrong-choice"
                    is_simulate_correct = False
                    
                resp_create = QuestionResponseCreate(
                    question_id=q_id,
                    selected_answer=selected_answer,
                    response_time_seconds=15.0
                )
                
                await assessment_service.submit_response(db_session_id, resp_create, user_id)
                
                # Fetch target difficulty update
                db.expire_all()
                session_refresh = await db.get(AssessmentSession, db_session_id)
                assert session_refresh is not None
                print(f"   Submitted answer (Correct={is_simulate_correct}). Next target difficulty: {session_refresh.current_difficulty}")
                
            except ValueError as val_err:
                if "No more questions available" in str(val_err):
                    print("Received completion signal: No more questions available.")
                    break
                else:
                    raise val_err

        # 7. Complete the assessment
        result_payload = await assessment_service.complete_assessment(db_session_id, user_id)
        print("Assessment completed successfully!")
        print("Final Report:")
        print(f"   Overall level: {result_payload['overall_proficiency']}")
        print(f"   Confidence: {result_payload['confidence_score'] * 100:.1f}%")
        print(f"   Full Path ({len(result_payload['learning_path'])} modules): {result_payload['learning_path']}")
        
        # Verify that learner profile is flagged as completed
        updated_profile = await learner_service.get_learner_profile_by_user_id(user_id)
        assert updated_profile is not None
        print(f"Learner Profile assessment_completed status: {updated_profile.assessment_completed}")
        assert updated_profile.assessment_completed is True
        
        # Cleanup test user
        p_list = (await db.execute(select(LearnerProfile).where(LearnerProfile.user_id == user_id))).scalars().all()
        for p in p_list:
            await db.delete(p)
            
        s_list = (await db.execute(select(AssessmentSession).where(AssessmentSession.learner_id == user_id))).scalars().all()
        for s in s_list:
            r_list = (await db.execute(select(AssessmentResult).where(AssessmentResult.session_id == s.id))).scalars().all()
            for r in r_list:
                await db.delete(r)
            await db.delete(s)
            
        await db.delete(user)
        await db.commit()
        print("Cleanup successful. Test complete!")


if __name__ == "__main__":
    asyncio.run(test_flow())
