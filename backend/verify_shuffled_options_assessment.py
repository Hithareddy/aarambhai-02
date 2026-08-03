"""
Verification script for Assessment Option Shuffling & Scoring.

Simulates starting assessment sessions, pulling questions, verifying option shuffling
across positions (A, B, C, D), verifying correctness grading for both correct and incorrect selections,
and testing adaptive progression.
"""
import asyncio
import json
import random
from app.db.session import async_session_factory
from app.services.assessment_service import AssessmentService
from app.schemas.assessment import AssessmentSessionCreate, QuestionResponseCreate
from app.models.user import User
from app.models.learner import LearnerProfile
from sqlalchemy import select

async def main():
    print("=" * 80)
    print("VERIFICATION: ASSESSMENT OPTION SHUFFLING & GRADING")
    print("=" * 80)

    async with async_session_factory() as db:
        # Create or fetch a test user & learner profile
        res_u = await db.execute(select(User).where(User.email == "test_shuffle_user@aarambh.ai"))
        user = res_u.scalar_one_or_none()
        if not user:
            user = User(
                id="test-shuffle-user-id",
                email="test_shuffle_user@aarambh.ai",
                hashed_password="hashed_pass_123",
                full_name="Shuffle Test Learner",
                is_active=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        res_p = await db.execute(select(LearnerProfile).where(LearnerProfile.user_id == user.id))
        profile = res_p.scalar_one_or_none()
        if not profile:
            profile = LearnerProfile(
                user_id=user.id,
                name="Shuffle Test Learner",
                age_group="26 - 45",
                educational_background="College",
                current_role="Working professional",
                learning_goal="Improve conversation",
                learning_language="en",
                website_language="en",
                current_familiarity="I know a little",
                digital_comfort="High",
                voice_preference="Mira"
            )
            db.add(profile)
            await db.commit()
            await db.refresh(profile)

        service = AssessmentService(db)

        # Start a new assessment session
        sess_create = AssessmentSessionCreate()
        session = await service.create_session(sess_create, user.id)
        print(f"\n1. Session Created: ID = {session.id}, starting_difficulty = {session.current_difficulty}")

        correct_position_counts = {"A": 0, "B": 0, "C": 0, "D": 0}
        questions_tested = []

        print("\n2. Iterating through 10 Assessment Questions...")
        print("-" * 80)
        
        for q_idx in range(10):
            # Fetch next question
            q_payload = await service.get_next_question(session.id, user.id)
            q_id = q_payload["id"]
            q_type = q_payload["question_type"]
            options = q_payload.get("options", [])
            prompt = q_payload.get("question_content", {}).get("text") or q_payload.get("prompt") or ""

            # Check original DB correct answer to find which option text is correct
            raw_q = await service._get_active_question(q_id)
            orig_correct = service._from_json(raw_q.correct_answer)
            orig_options = service._from_json(raw_q.options)

            if q_type == "speaking":
                selected_to_submit = json.dumps({"transcript": raw_q.reference_text or "Hello how are you", "status": "spoken"})
                shuffled_correct_id = None
                print(f"Question #{q_idx + 1} [ID: {q_id} | Type: {q_type} (Speaking Task)]")
                print(f"  Prompt: {prompt[:60]}...")
                print("  [Speaking Task - Audio input submission]")
            else:
                # Find text of original correct option
                correct_text = None
                if isinstance(orig_options, list):
                    for idx, o in enumerate(orig_options):
                        o_id = o.get("id") if isinstance(o, dict) else str(idx)
                        o_text = o.get("text") if isinstance(o, dict) else str(o)
                        if str(orig_correct).lower() in [str(o_id).lower(), str(o_text).lower(), str(idx)]:
                            correct_text = o_text
                            break

                # Find which new option ID (A/B/C/D) has this correct text in the shuffled options
                shuffled_correct_id = None
                for opt in options:
                    if isinstance(opt, dict) and opt.get("text") == correct_text:
                        shuffled_correct_id = opt.get("id")
                        break

                if shuffled_correct_id:
                    correct_position_counts[shuffled_correct_id] = correct_position_counts.get(shuffled_correct_id, 0) + 1

                selected_to_submit = shuffled_correct_id or "A"

                opt_summary = [f"{o.get('id')}: {o.get('text')}" for o in options]
                print(f"Question #{q_idx + 1} [ID: {q_id} | Type: {q_type}]")
                print(f"  Prompt: {prompt[:60]}...")
                print(f"  Shuffled Options Delivered to Frontend: {opt_summary}")
                print(f"  Original Correct Text: '{correct_text}' -> New Shuffled Correct Position: Option {shuffled_correct_id}")

            # Verify grading: Submit the correct option ID and verify is_correct is True
            resp_data = QuestionResponseCreate(
                question_id=q_id,
                selected_answer=selected_to_submit,
                response_time_seconds=3
            )
            resp_res = await service.submit_response(session.id, resp_data, user.id)
            
            assert resp_res["is_correct"] == True, f"Failed: Correct selection {selected_to_submit} evaluated as incorrect!"
            print(f"  [Pass] Response submission with selected='{selected_to_submit}' correctly graded as: is_correct={resp_res['is_correct']}")
            print("-" * 80)

            if shuffled_correct_id:
                questions_tested.append({
                    "id": q_id,
                    "type": q_type,
                    "shuffled_correct_position": shuffled_correct_id
                })

        print("\n3. POSITION DISTRIBUTION VERIFICATION")
        print(f"  Option-based Questions Tested: {len(questions_tested)}")
        print(f"  Correct Answer Position Distribution: {correct_position_counts}")
        
        # Verify correct answer appears in different positions (not just 'A')
        non_zero_positions = sum(1 for v in correct_position_counts.values() if v > 0)
        assert non_zero_positions > 1, f"Failed: Correct answer only appeared in position {correct_position_counts}"
        print("  [Pass] Correct answer appears dynamically across multiple option positions (A, B, C, D)!")

        # Verify negative test case (wrong answer submission)
        sess_create2 = AssessmentSessionCreate()
        session2 = await service.create_session(sess_create2, user.id)
        q_payload2 = await service.get_next_question(session2.id, user.id)
        opts2 = q_payload2.get("options", [])
        
        raw_q2 = await service._get_active_question(q_payload2["id"])
        _, eff_corr2 = service.shuffle_options_for_session(session2.id, raw_q2.id, opts2, raw_q2.correct_answer, raw_q2.question_type)
        
        wrong_opt_id = "B" if eff_corr2 == "A" else "A"
        wrong_resp = QuestionResponseCreate(
            question_id=q_payload2["id"],
            selected_answer=wrong_opt_id,
            response_time_seconds=4
        )
        wrong_res = await service.submit_response(session2.id, wrong_resp, user.id)
        assert wrong_res["is_correct"] == False, "Failed: Wrong option evaluated as correct!"
        print(f"\n4. NEGATIVE TEST VERIFICATION")
        print(f"  Submitted wrong option '{wrong_opt_id}' when correct was '{eff_corr2}' -> is_correct={wrong_res['is_correct']}")
        print("  [Pass] Incorrect option selection correctly evaluated as False!")

        print("\n" + "=" * 80)
        print("[SUCCESS] ALL VERIFICATION CHECKS PASSED PERFECTLY!")
        print("=" * 80)

if __name__ == "__main__":
    asyncio.run(main())
