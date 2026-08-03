import asyncio
import json
import os
import sys

# Force selector event loop policy on Windows for asyncio SQLAlchemy compatibility
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.question import Question
from app.models.translation import ContentTranslation

async def backup_assessment_data():
    print("Executing Part 5C Step 1: Backing up existing database assessment data...")
    async with async_session_factory() as session:
        # Query all existing questions
        stmt_q = select(Question)
        result_q = await session.execute(stmt_q)
        questions = result_q.scalars().all()
        
        q_backup = []
        for q in questions:
            q_backup.append({
                "id": q.id,
                "skill": q.skill,
                "domain": q.domain,
                "learning_goal": q.learning_goal,
                "difficulty": q.difficulty,
                "question_type": q.question_type,
                "question_content": q.question_content,
                "options": q.options,
                "correct_answer": q.correct_answer,
                "audio_url": q.audio_url,
                "audio_script": q.audio_script,
                "image_url": q.image_url,
                "reference_text": q.reference_text,
                "expected_keywords": q.expected_keywords,
                "is_active": q.is_active,
                "tags": q.tags
            })
            
        # Query existing content translations
        stmt_t = select(ContentTranslation)
        result_t = await session.execute(stmt_t)
        translations = result_t.scalars().all()
        
        t_backup = []
        for t in translations:
            t_backup.append({
                "id": t.id,
                "entity_type": t.entity_type,
                "entity_id": t.entity_id,
                "language_code": t.language_code,
                "translated_fields": t.translated_fields
            })

        backup_payload = {
            "questions_count": len(q_backup),
            "translations_count": len(t_backup),
            "questions": q_backup,
            "translations": t_backup
        }

        output_path = os.path.abspath("assessment_question_backup_v4.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(backup_payload, f, indent=2, ensure_ascii=False)

        print(f"\n=== ASSESSMENT DATABASE BACKUP COMPLETE ===")
        print(f"Existing Questions Backed Up: {len(q_backup)}")
        print(f"Existing Translations Backed Up: {len(t_backup)}")
        print(f"Backup Artifact Saved To: {output_path}")

if __name__ == "__main__":
    asyncio.run(backup_assessment_data())
