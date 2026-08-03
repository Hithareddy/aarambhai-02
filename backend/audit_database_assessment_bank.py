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

INTERNAL_METADATA_PATTERNS = [
    r"scenario\s*#", r"question\s*#", r"activity\s*#", r"audio clip\s*#",
    r"case\s*#", r"q-exp-", r"cat-rea-", r"cat-lis-", r"cat-spe-", r"cat-wri-", r"cat-com-"
]

async def audit_database_bank():
    print("Executing Part 5C Step 17: Auditing Integrated PostgreSQL Assessment Database...")
    
    async with async_session_factory() as session:
        stmt = select(Question).where(Question.is_active.is_(True))
        result = await session.execute(stmt)
        questions = result.scalars().all()

        total_active = len(questions)
        skill_counts = Counter()
        diff_counts = Counter()
        qtype_counts = Counter()

        defects = []

        for q in questions:
            qid = str(q.id)
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
                    defects.append(f"{qid}: Malformed question_content JSON")

            inst = qc.get("text") or qc.get("visible_instruction") or ""
            stim = qc.get("stimulus") or ""
            full_text = f"{inst} {stim} {q.options or ''} {q.correct_answer or ''}"

            # Check for internal metadata leakage
            for pattern in INTERNAL_METADATA_PATTERNS:
                if re.search(pattern, full_text, re.IGNORECASE):
                    defects.append(f"{qid}: Internal metadata pattern '{pattern}' leaked in visible content")

            # Check media contracts
            if skill == "listening" and not q.audio_script:
                defects.append(f"{qid}: Listening item lacks audio_script")
            if skill == "speaking" and not q.reference_text:
                defects.append(f"{qid}: Speaking item lacks reference_text")
            if qtype == "road_signs" and not q.image_url:
                defects.append(f"{qid}: Road sign item lacks image_url")

        print("\n=== POSTGRESQL DATABASE AUDIT SUMMARY ===")
        print(f"Total Active Questions in DB: {total_active}")
        print(f"Skill Distribution: {dict(skill_counts)}")
        print(f"Difficulty Distribution (Levels 1-5): {dict(diff_counts)}")
        print(f"Question Type Distribution: {dict(qtype_counts)}")
        print(f"Total Defects Found in Active DB Bank: {len(defects)}")

        if defects:
            for d in defects[:5]:
                print(f"  - [DEFECT] {d}")
        else:
            print("  [SUCCESS] 0 Defects Found! Database bank is 100% certified and structurally sound.")

        audit_result = {
            "total_active": total_active,
            "skill_distribution": dict(skill_counts),
            "difficulty_distribution": dict(diff_counts),
            "qtype_distribution": dict(qtype_counts),
            "defects_count": len(defects),
            "defects": defects
        }

        with open("db_assessment_audit_results.json", "w", encoding="utf-8") as f:
            json.dump(audit_result, f, indent=2)

if __name__ == "__main__":
    asyncio.run(audit_database_bank())
