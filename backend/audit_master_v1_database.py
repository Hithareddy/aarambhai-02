import asyncio
import json
import re
import sys
from collections import Counter

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.question import Question

LEGACY_PATTERNS = [
    r"q-exp-", r"Scenario #", r"everyday scenario #", r"audio clip #", r"cat-rea-", r"cat-lis-"
]

async def audit_master_v1_database():
    print("Executing Phase 1 Step 7: Comprehensive Database-Level Audit of Master V1 Bank...")
    
    async with async_session_factory() as session:
        # 1. Query Active Questions (is_active = True)
        stmt_active = select(Question).where(Question.is_active.is_(True))
        res_active = await session.execute(stmt_active)
        active_questions = res_active.scalars().all()

        # 2. Query Archived / Inactive Questions (is_active = False)
        stmt_inactive = select(Question).where(Question.is_active.is_(False))
        res_inactive = await session.execute(stmt_inactive)
        inactive_questions = res_inactive.scalars().all()

        total_active = len(active_questions)
        total_inactive = len(inactive_questions)

        skill_counts = Counter()
        diff_counts = Counter()
        qtype_counts = Counter()
        
        audio_script_count = 0
        image_required_count = 0
        passage_count = 0
        microphone_count = 0
        
        seen_ids = set()
        duplicate_ids = set()
        missing_fields = []
        legacy_active_found = []

        for q in active_questions:
            qid = str(q.id)
            if qid in seen_ids:
                duplicate_ids.add(qid)
            seen_ids.add(qid)

            skill = q.skill
            diff = q.difficulty
            qtype = q.question_type

            skill_counts[skill] += 1
            diff_counts[diff] += 1
            qtype_counts[qtype] += 1

            # Parse question_content
            qc = {}
            if q.question_content:
                try:
                    qc = json.loads(q.question_content)
                except Exception:
                    missing_fields.append(f"{qid}: Malformed question_content JSON")

            # Check legacy patterns in active pool
            full_text = f"{qc.get('instruction', '')} {qc.get('prompt', '')} {q.options or ''}"
            for p in LEGACY_PATTERNS:
                if re.search(p, full_text, re.IGNORECASE) or qid.startswith("cat-") or qid.startswith("q-"):
                    legacy_active_found.append(f"{qid}: Legacy pattern '{p}' found in active pool")

            # Check media contracts
            media_contract = qc.get("media_contract") or {}
            if q.audio_script or media_contract.get("audio_required"):
                audio_script_count += 1
            if qc.get("image_spec") or media_contract.get("image_required"):
                image_required_count += 1
            if qc.get("passage"):
                passage_count += 1
            if media_contract.get("microphone_required") or skill == "speaking":
                microphone_count += 1

            # Required fields validation
            if not qc.get("instruction") and not qc.get("prompt"):
                missing_fields.append(f"{qid}: Missing prompt/instruction")

        print("\n=== MASTER V1 DATABASE AUDIT RESULTS ===")
        print(f"Total Active Questions in Database: {total_active} (Expected: 500)")
        print(f"Total Archived / Legacy Questions in Database: {total_inactive}")
        print(f"Unique Active Question IDs: {len(seen_ids)} | Duplicate IDs: {len(duplicate_ids)}")
        
        print("\n--- Skill Distribution ---")
        for s in ["listening", "speaking", "reading", "writing", "everyday_communication"]:
            print(f"  - {s.upper()}: {skill_counts[s]} questions")

        print("\n--- Difficulty Distribution (Levels 1-5) ---")
        for d in range(1, 6):
            print(f"  - Level {d}: {diff_counts[d]} questions")

        print("\n--- Question-Type Distribution ---")
        for qt, count in qtype_counts.items():
            print(f"  - {qt}: {count}")

        print("\n--- Media & Contract Audit ---")
        print(f"  - Questions with audio_script: {audio_script_count}")
        print(f"  - Questions requiring image assets (image_spec non-null): {image_required_count}")
        print(f"  - Questions with passages/source text: {passage_count}")
        print(f"  - Speaking questions requiring microphone: {microphone_count}")

        print("\n--- Compliance Checks ---")
        print(f"  - Missing required fields: {len(missing_fields)}")
        print(f"  - Legacy/generated questions eligible for Initial Assessment: {len(legacy_active_found)}")

        if len(duplicate_ids) == 0 and len(missing_fields) == 0 and len(legacy_active_found) == 0 and total_active == 500:
            print("\n  [DATABASE PASS] 500 Master V1 questions active, 0 duplicates, 0 legacy items eligible!")

        audit_summary = {
            "total_active": total_active,
            "total_archived": total_inactive,
            "skill_distribution": dict(skill_counts),
            "difficulty_distribution": dict(diff_counts),
            "qtype_distribution": dict(qtype_counts),
            "audio_script_count": audio_script_count,
            "image_required_count": image_required_count,
            "passage_count": passage_count,
            "microphone_count": microphone_count,
            "duplicate_ids_count": len(duplicate_ids),
            "missing_fields_count": len(missing_fields),
            "legacy_active_count": len(legacy_active_found)
        }

        with open("master_v1_db_audit_results.json", "w", encoding="utf-8") as f:
            json.dump(audit_summary, f, indent=2)

if __name__ == "__main__":
    asyncio.run(audit_master_v1_database())
