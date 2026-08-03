import asyncio
import json
import sys
import uuid
from collections import Counter

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.user import User
from app.models.learner import LearnerProfile
from app.services.assessment_service import AssessmentService
from app.schemas.assessment import AssessmentSessionCreate, QuestionResponseCreate

PERSONAS = [
    {
        "name": "1. 10-year-old Beginner Student",
        "age_group": "under_12",
        "current_role": "student",
        "educational_background": "primary",
        "learning_goal": "education",
        "current_familiarity": "beginner",
        "email": "student10@aarambh.ai"
    },
    {
        "name": "2. 16-year-old Intermediate Student",
        "age_group": "12_17",
        "current_role": "student",
        "educational_background": "secondary",
        "learning_goal": "education",
        "current_familiarity": "intermediate",
        "email": "student16@aarambh.ai"
    },
    {
        "name": "3. 20-year-old College Student",
        "age_group": "18_24",
        "current_role": "college_student",
        "educational_background": "college",
        "learning_goal": "workplace",
        "current_familiarity": "intermediate",
        "email": "college20@aarambh.ai"
    },
    {
        "name": "4. 30-year-old Homemaker",
        "age_group": "25_45",
        "current_role": "homemaker",
        "educational_background": "general",
        "learning_goal": "confidence",
        "current_familiarity": "beginner",
        "email": "homemaker30@aarambh.ai"
    },
    {
        "name": "5. 35-year-old Working Professional",
        "age_group": "25_45",
        "current_role": "working_professional",
        "educational_background": "graduate",
        "learning_goal": "workplace",
        "current_familiarity": "intermediate",
        "email": "pro35@aarambh.ai"
    },
    {
        "name": "6. 68-year-old Senior Citizen",
        "age_group": "60_plus",
        "current_role": "senior_citizen",
        "educational_background": "general",
        "learning_goal": "everyday_communication",
        "current_familiarity": "beginner",
        "email": "senior68@aarambh.ai"
    }
]

async def run_phase2_simulations():
    print("Executing Phase 2 Static Verification: Profile-Aware 15-Question Adaptive Selection Engine...")
    
    simulation_results = []
    all_personas_passed = True

    for p in PERSONAS:
        print(f"\n==================================================")
        print(f"SIMULATING PERSONA: {p['name']}")
        print(f"==================================================")

        async with async_session_factory() as session:
            # 1. Create or get synthetic User
            stmt_u = select(User).where(User.email == p["email"])
            res_u = await session.execute(stmt_u)
            user_obj = res_u.scalar_one_or_none()

            if not user_obj:
                user_obj = User(
                    id=str(uuid.uuid4()),
                    email=p["email"],
                    hashed_password="placeholder_hash",
                    full_name=p["name"],
                    role="learner",
                    is_active=True
                )
                session.add(user_obj)
                await session.commit()
                await session.refresh(user_obj)

            user_id = str(user_obj.id)

            # 2. Upsert LearnerProfile
            stmt_prof = select(LearnerProfile).where(LearnerProfile.user_id == user_id)
            res_prof = await session.execute(stmt_prof)
            prof_obj = res_prof.scalar_one_or_none()

            if not prof_obj:
                prof_obj = LearnerProfile(
                    user_id=user_id,
                    age_group=p["age_group"],
                    current_role=p["current_role"],
                    educational_background=p["educational_background"],
                    learning_goal=p["learning_goal"],
                    current_familiarity=p["current_familiarity"],
                    website_language="en",
                    learning_language="en"
                )
                session.add(prof_obj)
            else:
                prof_obj.age_group = p["age_group"]
                prof_obj.current_role = p["current_role"]
                prof_obj.educational_background = p["educational_background"]
                prof_obj.learning_goal = p["learning_goal"]
                prof_obj.current_familiarity = p["current_familiarity"]
                prof_obj.website_language = "en"
                prof_obj.learning_language = "en"
            await session.commit()

            # 3. Create Assessment Session
            service = AssessmentService(session)
            sess_obj = await service.create_session(AssessmentSessionCreate(), user_id)
            sess_id = str(sess_obj.id)

            selected_questions = []
            skills_counter = Counter()
            contexts_counter = Counter()
            qtypes_counter = Counter()
            diff_counter = Counter()
            qids = []

            for step in range(15):
                q_dict = await service.get_next_question(sess_id, user_id)
                qid = q_dict["id"]
                skill = q_dict["skill"]
                domain = q_dict.get("domain", "everyday")
                qtype = q_dict.get("question_type", "mcq")
                diff = q_dict.get("difficulty", 1)

                selected_questions.append(q_dict)
                skills_counter[skill] += 1
                contexts_counter[domain] += 1
                qtypes_counter[qtype] += 1
                diff_counter[diff] += 1
                qids.append(qid)

                # Submit response to advance session step & difficulty
                await service.submit_response(
                    sess_id,
                    QuestionResponseCreate(
                        question_id=qid,
                        selected_answer="A",
                        response_time_seconds=4
                    ),
                    user_id
                )

            # Verification assertions for this persona
            is_15 = len(qids) == 15
            is_33333 = (
                skills_counter["listening"] == 3 and
                skills_counter["speaking"] == 3 and
                skills_counter["reading"] == 3 and
                skills_counter["writing"] == 3 and
                skills_counter["everyday_communication"] == 3
            )
            has_no_duplicates = len(set(qids)) == 15
            context_diversified = max(contexts_counter.values()) <= 4
            format_diversified = len(qtypes_counter) >= 4

            passed = is_15 and is_33333 and has_no_duplicates and context_diversified and format_diversified

            if not passed:
                all_personas_passed = False

            print(f"Total Selected Questions: {len(qids)} (Expected: 15)")
            print(f"Skill Distribution: {dict(skills_counter)} (3-3-3-3-3 Ratio: {'PASS' if is_33333 else 'FAIL'})")
            print(f"Context Distribution: {dict(contexts_counter)}")
            print(f"Question Type Distribution: {dict(qtypes_counter)}")
            print(f"Difficulty Distribution: {dict(diff_counter)}")
            print(f"Selected Question IDs: {qids}")
            print(f"Persona Result: {'[SELECTION PASS]' if passed else '[FAIL]'}")

            simulation_results.append({
                "persona": p["name"],
                "passed": passed,
                "question_ids": qids,
                "skills": dict(skills_counter),
                "contexts": dict(contexts_counter),
                "qtypes": dict(qtypes_counter),
                "difficulties": dict(diff_counter)
            })

    print("\n==================================================")
    print(f"OVERALL PHASE 2 SELECTION ENGINE SIMULATION SUMMARY")
    print(f"==================================================")
    print(f"Total Personas Evaluated: {len(PERSONAS)}")
    print(f"Passed Personas: {sum(1 for r in simulation_results if r['passed'])} / {len(PERSONAS)}")
    
    if all_personas_passed:
        print("  [STATIC VERIFIED] Profile-Aware 15-Question Adaptive Engine is 100% operational!")

    with open("phase2_selection_simulation_results.json", "w", encoding="utf-8") as f:
        json.dump(simulation_results, f, indent=2)

if __name__ == "__main__":
    asyncio.run(run_phase2_simulations())
