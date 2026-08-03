import sys
import json
import asyncio
from app.db.session import async_session_factory
from app.services.assessment_service import AssessmentService

async def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing args"}))
        return

    session_id = sys.argv[1]
    question_id = sys.argv[2]

    async with async_session_factory() as db:
        service = AssessmentService(db)
        q = await service._get_active_question(question_id)
        raw_opts = service._from_json(q.options)
        raw_corr = service._from_json(q.correct_answer)
        
        shuffled_opts, eff_corr = service.shuffle_options_for_session(
            session_id, question_id, raw_opts, raw_corr, q.question_type or ""
        )
        
        print(json.dumps({
            "question_id": question_id,
            "question_type": q.question_type,
            "shuffled_options": shuffled_opts,
            "effective_correct_id": eff_corr,
            "original_correct": raw_corr
        }))

if __name__ == "__main__":
    asyncio.run(main())
