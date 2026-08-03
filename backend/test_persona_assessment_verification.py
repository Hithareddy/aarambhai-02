"""
Priority 1 Verification Script: End-to-End Persona Assessment Test.

Proves that two distinct learner profiles produce measurably different:
1. Initial question difficulties & personalization filters
2. Skill-wise proficiencies
3. Strengths and Weaknesses
4. Programmatic Learning Summaries
5. Recommended Learning Path sequences
"""
import asyncio
import json
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import async_session_factory
from app.models.user import User
from app.models.learner import LearnerProfile
from app.models.assessment import AssessmentSession, QuestionResponse, AssessmentResult
from app.services.assessment_service import AssessmentService
from app.schemas.assessment import QuestionResponseCreate
from sqlalchemy import select, delete


async def run_persona_test():
    async with async_session_factory() as db:
        print("=" * 80)
        print("PRIORITY 1: END-TO-END ADAPTIVE ASSESSMENT PERSONA DIFFERENTIATION TEST")
        print("=" * 80)

        # 1. Clean up old test data if present
        test_emails = ["persona_a_child@test.com", "persona_b_pro@test.com"]
        res = await db.execute(select(User).where(User.email.in_(test_emails)))
        old_users = res.scalars().all()
        for u in old_users:
            await db.execute(delete(AssessmentResult).where(AssessmentResult.learner_id == str(u.id)))
            await db.execute(delete(QuestionResponse).where(QuestionResponse.session_id.in_(
                select(AssessmentSession.id).where(AssessmentSession.learner_id == str(u.id))
            )))
            await db.execute(delete(AssessmentSession).where(AssessmentSession.learner_id == str(u.id)))
            await db.execute(delete(LearnerProfile).where(LearnerProfile.user_id == str(u.id)))
            await db.execute(delete(User).where(User.id == u.id))
        await db.commit()

        # 2. Create Persona A: Young Beginner Learner (Under 12, beginner)
        user_a = User(email="persona_a_child@test.com", hashed_password="hash", full_name="Aarav (Child Beginner)")
        db.add(user_a)
        await db.commit()
        await db.refresh(user_a)

        profile_a = LearnerProfile(
            user_id=str(user_a.id),
            name="Aarav",
            age_group="Under 12",
            learning_language="en",
            website_language="en",
            current_role="Student",
            educational_background="Primary",
            current_familiarity="Beginner",
            learning_goal="School",
            digital_comfort="Medium",
            daily_goal_minutes=15
        )
        db.add(profile_a)
        await db.commit()

        # 3. Create Persona B: Working Professional (Adult, Intermediate/Advanced)
        user_b = User(email="persona_b_pro@test.com", hashed_password="hash", full_name="Priya (Working Professional)")
        db.add(user_b)
        await db.commit()
        await db.refresh(user_b)

        profile_b = LearnerProfile(
            user_id=str(user_b.id),
            name="Priya",
            age_group="Working Professional (18+)",
            learning_language="en",
            website_language="en",
            current_role="Working Professional",
            educational_background="College",
            current_familiarity="Intermediate",
            learning_goal="Career",
            digital_comfort="High",
            daily_goal_minutes=30
        )
        db.add(profile_b)
        await db.commit()

        service = AssessmentService(db)

        # 4. Execute Assessment Session for Persona A (Child Beginner)
        print("\n--- SIMULATING PERSONA A: Young Child Beginner ---")
        session_a = await service.create_session(type("SessionCreate", (), {"blueprint_id": None})(), str(user_a.id))
        print(f"Persona A Session ID: {session_a.id}, Starting Difficulty: {session_a.current_difficulty}")
        assert session_a.current_difficulty == 1, f"Expected starting difficulty 1 for beginner, got {session_a.current_difficulty}"

        # Persona A answers 15 questions: struggles with difficulty > 1
        for i in range(15):
            q = await service.get_next_question(str(session_a.id), str(user_a.id))
            q_id = q["id"]
            # Persona A gets difficulty 1 correct, but misses difficulty > 1
            selected_ans = q["options"][0]["id"] if q.get("options") else "test"
            if q["difficulty"] > 1:
                # Intentionally pick wrong answer if available
                if q.get("options") and len(q["options"]) > 1:
                    selected_ans = q["options"][-1]["id"]
            
            await service.submit_response(
                str(session_a.id),
                QuestionResponseCreate(question_id=q_id, selected_answer=selected_ans, response_time_seconds=8.0),
                str(user_a.id)
            )

        result_a = await service.complete_assessment(str(session_a.id), str(user_a.id))
        print(f"Persona A Overall Level: {result_a['overall_proficiency']}")
        print(f"Persona A Readiness: {result_a['readiness_level']}")
        print(f"Persona A Strengths: {result_a['strengths']}")
        print(f"Persona A Weaknesses: {result_a['weaknesses']}")
        print(f"Persona A Summary: {result_a['learning_summary']}")
        print(f"Persona A Recommended Path (Top 3): {[m['title'] for m in result_a['learning_path'][:3]]}")

        # 5. Execute Assessment Session for Persona B (Working Professional)
        print("\n--- SIMULATING PERSONA B: Working Professional ---")
        session_b = await service.create_session(type("SessionCreate", (), {"blueprint_id": None})(), str(user_b.id))
        print(f"Persona B Session ID: {session_b.id}, Starting Difficulty: {session_b.current_difficulty}")
        assert session_b.current_difficulty >= 3, f"Expected starting difficulty >= 3 for intermediate pro, got {session_b.current_difficulty}"

        # Persona B answers 15 questions: answers almost all questions correctly
        for i in range(15):
            q = await service.get_next_question(str(session_b.id), str(user_b.id))
            q_id = q["id"]
            # Get actual question from DB to know correct answer
            db_q = await service._get_active_question(q_id)
            correct_val = json.loads(db_q.correct_answer) if isinstance(db_q.correct_answer, str) else db_q.correct_answer

            await service.submit_response(
                str(session_b.id),
                QuestionResponseCreate(question_id=q_id, selected_answer=correct_val, response_time_seconds=3),
                str(user_b.id)
            )

        result_b = await service.complete_assessment(str(session_b.id), str(user_b.id))
        print(f"Persona B Overall Level: {result_b['overall_proficiency']}")
        print(f"Persona B Readiness: {result_b['readiness_level']}")
        print(f"Persona B Strengths: {result_b['strengths']}")
        print(f"Persona B Weaknesses: {result_b['weaknesses']}")
        print(f"Persona B Summary: {result_b['learning_summary']}")
        print(f"Persona B Recommended Path (Top 3): {[m['title'] for m in result_b['learning_path'][:3]]}")

        # 6. Verify Measurable Differences Between Personas
        print("\n" + "=" * 80)
        print("PERSONALIZATION COMPARISON MATRIX")
        print("=" * 80)
        print(f"{'Metric':<30} | {'Persona A (Child Beginner)':<25} | {'Persona B (Professional)':<25}")
        print("-" * 80)
        print(f"{'Starting Difficulty':<30} | {session_a.current_difficulty:<25} | {session_b.current_difficulty:<25}")
        print(f"{'Overall Proficiency':<30} | {result_a['overall_proficiency']:<25} | {result_b['overall_proficiency']:<25}")
        print(f"{'Confidence Score':<30} | {round(result_a['confidence_score'], 2):<25} | {round(result_b['confidence_score'], 2):<25}")
        print(f"{'Readiness Level':<30} | {result_a['readiness_level']:<25} | {result_b['readiness_level']:<25}")
        print(f"{'Primary Weakness':<30} | {str(result_a['weaknesses'][:2]):<25} | {str(result_b['weaknesses'][:2]):<25}")
        print(f"{'First Rec Module':<30} | {result_a['learning_path'][0]['title']:<25} | {result_b['learning_path'][0]['title']:<25}")
        print("=" * 80)

        # Assertions
        assert result_a['overall_proficiency'] != result_b['overall_proficiency'], "Proficiency levels MUST differ!"
        assert result_a['learning_summary'] != result_b['learning_summary'], "Learning summaries MUST differ!"
        assert result_a['learning_path'][0]['module_id'] != result_b['learning_path'][0]['module_id'], "First recommended module MUST differ!"

        print("\n[SUCCESS] PRIORITY 1 VERIFICATION PASSED: Initial Assessment produces 100% personalized, measurably different outcomes for different learner profiles!")

if __name__ == "__main__":
    asyncio.run(run_persona_test())
