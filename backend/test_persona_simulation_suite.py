import asyncio
import json
import sys
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.user import User
from app.models.learner import LearnerProfile
from app.models.assessment import AssessmentSession, AssessmentBlueprint
from app.services.assessment_service import AssessmentService, LearnerService

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

PERSONAS = [
    {"name": "Child Beginner", "age": "Under 12", "role": "Student", "fam": "Complete beginner", "web_lang": "te", "learn_lang": "en", "dig": "This is my first time"},
    {"name": "Child Advanced", "age": "Under 12", "role": "Student", "fam": "I'm advanced", "web_lang": "en", "learn_lang": "en", "dig": "Very comfortable"},
    {"name": "School Intermediate", "age": "12 – 17", "role": "Student", "fam": "I know a little", "web_lang": "hi", "learn_lang": "en", "dig": "I've used a few apps"},
    {"name": "College Student", "age": "18 – 25", "role": "Student", "fam": "I'm comfortable", "web_lang": "en", "learn_lang": "en", "dig": "I use apps every day"},
    {"name": "College Advanced", "age": "18 – 25", "role": "Student", "fam": "I'm advanced", "web_lang": "te", "learn_lang": "en", "dig": "Very comfortable"},
    {"name": "Working Professional Beginner", "age": "26 – 45", "role": "Working professional", "fam": "Complete beginner", "web_lang": "te", "learn_lang": "en", "dig": "I've used a few apps"},
    {"name": "Working Professional Intermediate", "age": "26 – 45", "role": "Working professional", "fam": "I know a little", "web_lang": "en", "learn_lang": "en", "dig": "I use apps every day"},
    {"name": "Working Professional Advanced", "age": "26 – 45", "role": "Working professional", "fam": "I'm advanced", "web_lang": "en", "learn_lang": "en", "dig": "Very comfortable"},
    {"name": "Homemaker Telugu Support", "age": "26 – 45", "role": "Homemaker", "fam": "Complete beginner", "web_lang": "te", "learn_lang": "en", "dig": "This is my first time"},
    {"name": "Homemaker Hindi Support", "age": "26 – 45", "role": "Homemaker", "fam": "I know a little", "web_lang": "hi", "learn_lang": "en", "dig": "I've used a few apps"},
    {"name": "Senior Citizen Low Digital Comfort", "age": "60+", "role": "Senior citizen", "fam": "Complete beginner", "web_lang": "te", "learn_lang": "en", "dig": "This is my first time"},
    {"name": "Senior Citizen Intermediate", "age": "60+", "role": "Senior citizen", "fam": "I know a little", "web_lang": "en", "learn_lang": "en", "dig": "I've used a few apps"},
    {"name": "Just Curious Learner", "age": "18 – 25", "role": "Just curious", "fam": "Complete beginner", "web_lang": "en", "learn_lang": "en", "dig": "I use apps every day"},
    {"name": "Tamil Support Learner", "age": "18 – 25", "role": "Student", "fam": "I know a little", "web_lang": "ta", "learn_lang": "en", "dig": "I've used a few apps"},
    {"name": "Marathi Support Learner", "age": "26 – 45", "role": "Working professional", "fam": "I'm comfortable", "web_lang": "mr", "learn_lang": "en", "dig": "I use apps every day"},
    {"name": "English Support Telugu Learner", "age": "26 – 45", "role": "Working professional", "fam": "Complete beginner", "web_lang": "en", "learn_lang": "te", "dig": "Very comfortable"},
    {"name": "High Digital Comfort Learner", "age": "18 – 25", "role": "Student", "fam": "I'm comfortable", "web_lang": "en", "learn_lang": "en", "dig": "Very comfortable"},
    {"name": "Low Digital Comfort Learner", "age": "46 – 60", "role": "Homemaker", "fam": "Complete beginner", "web_lang": "te", "learn_lang": "en", "dig": "This is my first time"},
    {"name": "Career Goal Focus", "age": "26 – 45", "role": "Working professional", "fam": "I know a little", "web_lang": "en", "learn_lang": "en", "dig": "Very comfortable"},
    {"name": "Everyday Independence Focus", "age": "46 – 60", "role": "Senior citizen", "fam": "Complete beginner", "web_lang": "te", "learn_lang": "en", "dig": "This is my first time"}
]

async def run_simulations():
    print(f"Starting Persona Simulation Suite across {len(PERSONAS)} synthetic personas...")
    results = {"total": len(PERSONAS), "passed": 0, "failed": 0, "failures": []}

    async with async_session_factory() as db:
        service = AssessmentService(db)
        
        for p in PERSONAS:
            try:
                # 1. Create temporary synthetic user and profile
                dummy_email = f"persona_{p['name'].lower().replace(' ', '_')}@aarambh.ai"
                user = await db.scalar(select(User).where(User.email == dummy_email))
                if not user:
                    user = User(email=dummy_email, hashed_password="dummy_persona_hash", full_name=p['name'], is_active=True)
                    db.add(user)
                    await db.commit()
                    await db.refresh(user)

                profile = await db.scalar(select(LearnerProfile).where(LearnerProfile.user_id == user.id))
                if not profile:
                    profile = LearnerProfile(
                        user_id=user.id,
                        name=p['name'],
                        age_group=p['age'],
                        educational_background="Secondary school",
                        current_role=p['role'],
                        learning_goal="Everyday English",
                        learning_language=p['learn_lang'],
                        website_language=p['web_lang'],
                        current_familiarity=p['fam'],
                        digital_comfort=p['dig']
                    )
                    db.add(profile)
                    await db.commit()
                    await db.refresh(profile)

                # 2. Create assessment session
                from app.schemas.assessment import AssessmentSessionCreate
                session = await service.create_session(AssessmentSessionCreate(), user_id=user.id)
                
                # 3. Simulate 15 consecutive question steps
                questions_served = []
                for step in range(15):
                    q = await service.get_next_question(session.id, user.id)
                    if not q or not q.get("id"):
                        raise ValueError(f"Failed to obtain question at step {step + 1}")
                    questions_served.append(q)

                # 4. Verify persona acceptance criteria
                if len(questions_served) == 15:
                    results["passed"] += 1
                    print(f"  [PASS] Persona '{p['name']}': 15/15 questions obtained cleanly.")
                else:
                    results["failed"] += 1
                    results["failures"].append({"name": p['name'], "reason": f"Only obtained {len(questions_served)} questions"})
            except Exception as e:
                results["failed"] += 1
                results["failures"].append({"name": p['name'], "reason": str(e)})

    print("\n=== PERSONA SIMULATION SUITE RESULTS ===")
    print(f"Total Personas Tested: {results['total']}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    if results['failures']:
        print("Failures:")
        print(json.dumps(results['failures'], indent=2))
    
    with open("persona_simulation_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    asyncio.run(run_simulations())
