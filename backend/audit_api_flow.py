import asyncio
import sys
import json

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.session import async_session_factory, init_db
from app.services.assessment_service import AssessmentService
from app.services.learner_service import LearnerService
from app.models.user import User
from app.models.learner import LearnerProfile
from app.schemas.learner import LearnerProfileCreate
from app.schemas.assessment import AssessmentSessionCreate, QuestionResponseCreate
from sqlalchemy import select, delete

async def audit_api_flow():
    await init_db()
    async with async_session_factory() as db:
        service = AssessmentService(db)
        learner_svc = LearnerService(db)

        # Create user & profile for Under 12 Telugu learner
        uid = 'audit-u12-telugu'
        await db.execute(delete(LearnerProfile).where(LearnerProfile.user_id == uid))
        await db.execute(delete(User).where(User.id == uid))
        await db.commit()

        u = User(id=uid, email='u12telugu@test.com', hashed_password='x', full_name='Under 12 Telugu Learner')
        db.add(u)
        await db.commit()

        p_data = LearnerProfileCreate(
            name='Child Telugu',
            age_group='Under 12',
            educational_background='Primary school',
            current_role='Student',
            learning_goal='Everyday Communication',
            learning_language='te',
            website_language='te',
            daily_goal_minutes=15,
            current_familiarity='Complete beginner',
            digital_comfort='Very comfortable'
        )
        await learner_svc.create_learner_profile(p_data, uid)

        # Start session
        sess = await service.create_session(AssessmentSessionCreate(), uid)
        sid = str(sess.id)
        print(f"Created NEW Assessment Session: {sid} for Learner {uid}")

        # Fetch 15 consecutive questions
        healthcare_or_adult_count = 0
        questions_fetched = []

        for idx in range(15):
            q_dict = await service.get_next_question(sid, user_id=uid)
            qid = q_dict['id']
            dom = q_dict.get('domain') or q_dict.get('topic_category') or ''
            qc = q_dict.get('question_content', {})
            text = qc.get('text') if isinstance(qc, dict) else str(qc)
            
            # Check for healthcare/adult topics
            is_adult = dom in ['healthcare', 'workplace', 'atm', 'investment'] or any(t in text.lower() for t in ['doctor', 'hospital', 'appointment', 'clinic'])
            if is_adult:
                healthcare_or_adult_count += 1

            questions_fetched.append((idx+1, qid, dom, text[:65]))
            
            # Submit dummy response
            ans = q_dict['options'][0]['id'] if q_dict.get('options') and len(q_dict['options']) > 0 else 'Hello'
            await service.submit_response(sid, QuestionResponseCreate(question_id=qid, selected_answer=ans, response_time_seconds=5), user_id=uid)

        print('\n=== 15 QUESTIONS SERVED BY ASSESSMENT SERVICE FOR UNDER 12 TELUGU LEARNER ===')
        for idx, qid, dom, txt in questions_fetched:
            safe_txt = txt.encode('ascii', errors='replace').decode('ascii')
            print(f"  Slot {idx:02d}: [{qid}] ({dom}) -> \"{safe_txt}...\"")

        print(f"\nAdult/Healthcare questions served: {healthcare_or_adult_count}/15")
        if healthcare_or_adult_count == 0:
            print("VERIFICATION PASSED: 0 Healthcare/Adult questions served to Under 12 Child!")
        else:
            print("VERIFICATION FAILED: Adult/Healthcare questions were served!")

if __name__ == '__main__':
    asyncio.run(audit_api_flow())
