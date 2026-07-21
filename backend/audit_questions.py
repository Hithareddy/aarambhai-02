import asyncio
import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings
from app.models.question import Question

async def audit():
    engine = create_async_engine(settings.DATABASE_URL, connect_args={"statement_cache_size": 0})
    session_factory = async_sessionmaker(engine, class_=AsyncSession)
    
    async with session_factory() as db:
        res = await db.execute(select(Question))
        questions = res.scalars().all()
        
        types_summary = {}
        for q in questions:
            q_type = q.question_type
            if q_type not in types_summary:
                types_summary[q_type] = []
            
            # Save one sample of question_content and options
            if len(types_summary[q_type]) < 1:
                types_summary[q_type].append({
                    "id": q.id,
                    "skill": q.skill,
                    "question_content": json.loads(q.question_content),
                    "options": json.loads(q.options),
                    "correct_answer": json.loads(q.correct_answer)
                })
        
        print("AUDIT RESULT written to audit_result.json")
        with open("audit_result.json", "w", encoding="utf-8") as f:
            json.dump(types_summary, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    asyncio.run(audit())
