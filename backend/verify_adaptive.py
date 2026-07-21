import asyncio
import json

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.assessment import AssessmentSession, QuestionResponse
from app.models.question import Question
from app.models.user import User
from app.schemas.assessment import QuestionResponseCreate
from app.schemas.learner import LearnerProfileUpdate
from app.services.assessment_service import AssessmentService
from app.services.learner_service import LearnerService


async def run_simulation():
    engine = create_async_engine(settings.DATABASE_URL, connect_args={"statement_cache_size": 0})
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as db:
        user_res = await db.execute(select(User).limit(1))
        user = user_res.scalar_one_or_none()
        if not user:
            print("No users found in database!")
            return

        print(f"Using test User ID: {user.id}")

        # 1. Update learner profile to Intermediate Telugu
        learner_service = LearnerService(db)
        profile = await learner_service.get_learner_profile_by_user_id(str(user.id))
        if profile:
            await learner_service.update_learner_profile(
                str(user.id),
                LearnerProfileUpdate(
                    learning_language="te",
                    current_familiarity="comfortable",  # level 3
                )
            )
            print("Set profile target language to 'te' and familiarity to 'comfortable' (Level 3).")

        assessment_service = AssessmentService(db)

        # 2. Start Assessment Session 1
        session1 = await assessment_service.create_session(
            session_data=type('obj', (object,), {"blueprint_id": None})(),
            user_id=str(user.id)
        )
        print(f"Session 1 Created. ID: {session1.id}, Starting difficulty: {session1.current_difficulty} (expected 3)")

        # 3. Answer correctly to increase difficulty
        out_lines = []
        out_lines.append(f"Using test User ID: {user.id}")
        out_lines.append(f"Session 1 Initial Difficulty: {session1.current_difficulty}")
        
        for step in range(3):
            question = await assessment_service.get_next_question(str(session1.id), str(user.id))
            out_lines.append(f"\n--- Q{step+1} Served (Difficulty: {question['difficulty']}) ---")
            out_lines.append(f"Question text: {question['question_content']['text']}")
            out_lines.append(f"Options: {[opt['text'] for opt in question['options']]}")
            out_lines.append(f"Is Fallback: {question['is_fallback']}")

            # Load correct answer
            q_db_res = await db.execute(select(Question).where(Question.id == question["id"]))
            q_db = q_db_res.scalar_one()
            correct_ans = json.loads(q_db.correct_answer)

            # Submit Correct Response
            resp = await assessment_service.submit_response(
                str(session1.id),
                QuestionResponseCreate(
                    question_id=question["id"],
                    selected_answer=correct_ans,
                    response_time_seconds=10
                ),
                str(user.id)
            )
            out_lines.append(f"Submitted correct answer: {correct_ans}. New Difficulty: {session1.current_difficulty}")

        # 4. Start Session 2 to test Global Question Avoidance
        session2 = await assessment_service.create_session(
            session_data=type('obj', (object,), {"blueprint_id": None})(),
            user_id=str(user.id)
        )
        
        # Get answered list
        s1_answered_res = await db.execute(
            select(QuestionResponse.question_id).where(QuestionResponse.session_id == str(session1.id))
        )
        s1_answered = list(s1_answered_res.scalars().all())
        out_lines.append(f"\nSession 1 Answered Question IDs: {s1_answered}")
        out_lines.append(f"Session 2 Created. Starting Difficulty: {session2.current_difficulty}")

        for step in range(3):
            question = await assessment_service.get_next_question(str(session2.id), str(user.id))
            is_repeated = question["id"] in s1_answered
            out_lines.append(f"\n--- Session 2 Q{step+1} Served ---")
            out_lines.append(f"Question ID: {question['id']}")
            out_lines.append(f"Text: {question['question_content']['text']}")
            out_lines.append(f"Is Repeate of Session 1: {is_repeated}")

            # Answer incorrectly (submit "X")
            resp = await assessment_service.submit_response(
                str(session2.id),
                QuestionResponseCreate(
                    question_id=question["id"],
                    selected_answer="X",
                    response_time_seconds=10
                ),
                str(user.id)
            )
            out_lines.append(f"Submitted incorrect answer 'X'. New Difficulty: {session2.current_difficulty}")

        # Clean Up
        await db.execute(text("DELETE FROM question_responses WHERE session_id IN (:s1, :s2)"), {"s1": str(session1.id), "s2": str(session2.id)})
        await db.execute(text("DELETE FROM assessment_sessions WHERE id IN (:s1, :s2)"), {"s1": str(session1.id), "s2": str(session2.id)})
        await db.commit()
        
        with open("adaptive_output.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(out_lines))
        print("Simulation complete. Wrote logs to adaptive_output.txt.")


if __name__ == "__main__":
    try:
        asyncio.run(run_simulation())
    except Exception as e:
        import traceback
        with open("verify_error.log", "w", encoding="utf-8") as f:
            f.write(traceback.format_exc())
        print("Error caught and written to verify_error.log")
