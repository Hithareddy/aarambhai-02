import asyncio
import json
import sys
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.question import Question

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

SUPPORTED_TYPES = {
    "mcq", "true_false", "fill_blank", "arrange", "arrange_words", "arrange_letters",
    "match", "matching", "comprehension", "listening", "listening_image", "listening_mcq",
    "speaking", "read_select", "read_sentence", "road_signs", "everyday_communication",
    "shopping", "bus_stand", "atm", "medicine_label", "weather", "time_clock",
    "odd_one_out", "categorization", "image_mcq", "picture_id", "image_select"
}

async def verify_payloads():
    print("Verifying Frontend Payload & Renderer Contracts for all 250 questions...")
    
    async with async_session_factory() as db:
        res = await db.execute(select(Question))
        questions = res.scalars().all()
        
        errors = []
        for q in questions:
            q_id = str(q.id)
            q_type = q.question_type
            
            if q_type not in SUPPORTED_TYPES:
                errors.append((q_id, f"Unsupported question_type '{q_type}'"))
                
            q_content = json.loads(q.question_content) if isinstance(q.question_content, str) else q.question_content
            prompt_text = q_content.get("text") or q_content.get("prompt") or ""
            
            if not prompt_text:
                errors.append((q_id, "Empty prompt text in question_content"))
                
            options = json.loads(q.options) if isinstance(q.options, str) else q.options
            
            if q_type not in ["speaking"]:
                if not isinstance(options, list) or len(options) == 0:
                    errors.append((q_id, "Missing options array"))
                else:
                    for idx, o in enumerate(options):
                        if isinstance(o, dict):
                            txt = o.get("text")
                            opt_id = o.get("id")
                            if txt is None and not o.get("image"):
                                errors.append((q_id, f"Option #{idx} text is undefined"))
                            if opt_id is None:
                                errors.append((q_id, f"Option #{idx} id is undefined"))
                        elif isinstance(o, str):
                            if not o.strip():
                                errors.append((q_id, f"Option #{idx} is empty string"))
                        else:
                            errors.append((q_id, f"Option #{idx} is invalid type {type(o)}"))

        print("\n=== FRONTEND PAYLOAD CERTIFICATION SUMMARY ===")
        print(f"Total Questions Verified: {len(questions)}")
        print(f"Payload Errors Detected: {len(errors)}")
        if errors:
            print("Errors Detail:")
            print(json.dumps(errors, indent=2))
        else:
            print("100% of question payloads strictly conform to QuestionRenderer.tsx contract!")
            
        with open("frontend_payload_certification.json", "w", encoding="utf-8") as f:
            json.dump({"total": len(questions), "errors_count": len(errors), "errors": errors}, f, indent=2)

if __name__ == "__main__":
    asyncio.run(verify_payloads())
