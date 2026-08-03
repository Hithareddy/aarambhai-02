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
from sqlalchemy import select, delete
from app.models.assessment import AssessmentSession, QuestionResponse, AssessmentResult

async def run_simulation():
    await init_db()
    async with async_session_factory() as db:
        service = AssessmentService(db)
        learner_svc = LearnerService(db)

        # Cleanup existing test users
        await db.execute(delete(LearnerProfile).where(LearnerProfile.user_id.like('test-persona-%')))
        await db.execute(delete(User).where(User.id.like('test-persona-%')))
        await db.commit()

        personas = [
            {
                'id': 'test-persona-1',
                'name': 'P1 (Child Telugu)',
                'website_lang': 'te',
                'learning_lang': 'te',
                'age_group': 'Under 12',
                'role': 'Student',
                'edu': 'Primary school',
                'fam': 'Complete beginner'
            },
            {
                'id': 'test-persona-2',
                'name': 'P2 (Child English/Telugu UI)',
                'website_lang': 'te',
                'learning_lang': 'en',
                'age_group': 'Under 12',
                'role': 'Student',
                'edu': 'Primary school',
                'fam': 'Beginner'
            },
            {
                'id': 'test-persona-3',
                'name': 'P3 (Working Professional Telugu Target)',
                'website_lang': 'en',
                'learning_lang': 'te',
                'age_group': '26 - 45',
                'role': 'Working professional',
                'edu': 'Graduate',
                'fam': 'I know a little'
            },
            {
                'id': 'test-persona-4',
                'name': 'P4 (Senior Citizen Hindi UI)',
                'website_lang': 'hi',
                'learning_lang': 'en',
                'age_group': '60+',
                'role': 'Senior citizen',
                'edu': 'Secondary school',
                'fam': 'Beginner'
            }
        ]

        for p in personas:
            print('='*70)
            print(f"SIMULATING PERSONA: {p['name']}")
            print(f"  Website Lang: {p['website_lang']} | Learning Lang: {p['learning_lang']}")
            print(f"  Age: {p['age_group']} | Role: {p['role']} | Edu: {p['edu']}")
            
            # Create user and profile
            u = User(id=p['id'], email=f"{p['id']}@test.com", hashed_password='x', full_name=p['name'])
            db.add(u)
            await db.commit()

            p_data = LearnerProfileCreate(
                name=p['name'],
                age_group=p['age_group'],
                educational_background=p['edu'],
                current_role=p['role'],
                learning_goal='Everyday Communication',
                learning_language=p['learning_lang'],
                website_language=p['website_lang'],
                daily_goal_minutes=15,
                current_familiarity=p['fam'],
                digital_comfort='Very comfortable'
            )
            profile = await learner_svc.create_learner_profile(p_data, p['id'])
            
            from app.schemas.assessment import AssessmentSessionCreate
            session_obj = await service.create_session(AssessmentSessionCreate(), p['id'])
            session_id = str(session_obj.id)

            selected_domains = []
            selected_questions = []

            for i in range(5):
                q_data = await service.get_next_question(session_id, user_id=p['id'])
                qid = q_data['id']
                dom = q_data.get('domain') or q_data.get('topic_category') or 'general'
                qc = q_data.get('question_content', {})
                prompt = qc.get('text') if isinstance(qc, dict) else str(qc)
                
                selected_domains.append(dom)
                selected_questions.append((qid, dom, prompt[:70]))

                # Submit answer to move to next question
                from app.schemas.assessment import QuestionResponseCreate
                ans = q_data['options'][0]['id'] if q_data.get('options') and len(q_data['options']) > 0 else 'Hello, nice to meet you'
                resp_obj = QuestionResponseCreate(question_id=qid, selected_answer=ans, response_time_seconds=5)
                await service.submit_response(session_id, resp_obj, user_id=p['id'])

            print(f"  Questions Selected for {p['name']}:")
            for qid, dom, prompt in selected_questions:
                safe_prompt = prompt.encode('ascii', errors='replace').decode('ascii')
                print(f"    - [{qid}] ({dom}): \"{safe_prompt}...\"")

if __name__ == '__main__':
    asyncio.run(run_simulation())
