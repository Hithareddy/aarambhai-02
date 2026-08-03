import asyncio
import json
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.question import Question

TEST_IDS = ["L001", "L041", "L080", "S001", "S009", "R001", "R006", "W001", "C001", "C080"]

async def run_retrieval_test():
    print("Executing Phase 1 Step 8: Testing Representative Master V1 Database Retrieval...")
    
    with open("data/aarambh_assessment_master_v1.json", "r", encoding="utf-8") as f:
        master_json = json.load(f)
        json_dict = {q["id"]: q for q in master_json["questions"]}

    async with async_session_factory() as session:
        stmt = select(Question).where(Question.id.in_(TEST_IDS))
        res = await session.execute(stmt)
        db_questions = res.scalars().all()
        db_dict = {q.id: q for q in db_questions}

        all_matched = True
        print("\n=== REPRESENTATIVE RETRIEVAL TEST RESULTS ===")

        for qid in TEST_IDS:
            json_item = json_dict.get(qid)
            db_item = db_dict.get(qid)

            if not db_item:
                print(f"  [FAIL] Item {qid} not found in database!")
                all_matched = False
                continue

            qc = json.loads(db_item.question_content)
            opts = json.loads(db_item.options) if db_item.options else []
            corr = json.loads(db_item.correct_answer) if db_item.correct_answer else None

            # Verify key content fields
            inst_match = qc.get("instruction") == json_item.get("instruction")
            prompt_match = qc.get("prompt") == json_item.get("prompt")
            passage_match = qc.get("passage") == json_item.get("passage")
            image_spec_match = qc.get("image_spec") == json_item.get("image_spec")
            audio_match = db_item.audio_script == json_item.get("audio_script")

            if inst_match and prompt_match and passage_match and image_spec_match and audio_match:
                print(f"  [IMPORT PASS] `{qid}` ({db_item.skill.upper()} L{db_item.difficulty} - {db_item.question_type}): Stored DB content matches JSON source exactly.")
                print(f"      - Prompt: \"{qc.get('prompt') or qc.get('instruction')}\"")
                if qc.get("passage"):
                    print(f"      - Passage: \"{qc.get('passage')[:60]}...\"")
                if db_item.audio_script:
                    print(f"      - Audio Script: \"{db_item.audio_script}\"")
                if qc.get("image_spec"):
                    print(f"      - Image Spec: \"{qc.get('image_spec')[:60]}...\"")
            else:
                print(f"  [MISMATCH] Item {qid} has content discrepancies between DB and JSON source.")
                all_matched = False

        if all_matched:
            print("\n  [STATIC VERIFIED] All representative master items loaded cleanly from PostgreSQL database!")

        with open("retrieval_test_results.json", "w", encoding="utf-8") as f:
            json.dump({"test_ids": TEST_IDS, "all_matched": all_matched}, f, indent=2)

if __name__ == "__main__":
    asyncio.run(run_retrieval_test())
