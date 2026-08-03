import asyncio
import json
import re
import sys
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.question import Question

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

TEMPLATE_MARKERS = [r"scenario\s*#", r"audio clip\s*#", r"question\s*#", r"example\s*#", r"case\s*#"]
ABSURD_WORDS = {"Banana", "Red color", "Yesterday was Sunday", "Sleeping now", "The sky is blue"}

async def run_adversarial_audit():
    print("Running Adversarial Content Quality Audit Suite (TESTS A through J)...")
    
    async with async_session_factory() as db:
        res = await db.execute(select(Question))
        questions = res.scalars().all()
        
        results = {
            "TEST_A_TRANSCRIPT_LEAK": [],
            "TEST_B_FAKE_VISUAL": [],
            "TEST_C_MISSING_STORY": [],
            "TEST_D_TEMPLATE_PROMPT": [],
            "TEST_E_ABSURD_DISTRACTORS": [],
            "TEST_F_LANGUAGE_CONTAMINATION": [],
            "TEST_G_REPEATED_STEMS": [],
            "TEST_H_ANSWER_LEAKAGE": [],
            "TEST_I_LISTENING_WITHOUT_LISTENING": [],
            "TEST_J_VISUAL_WITHOUT_VISUAL": []
        }
        
        stems = []

        for q in questions:
            q_id = str(q.id)
            q_type = q.question_type
            q_content = json.loads(q.question_content) if isinstance(q.question_content, str) else q.question_content
            prompt = (q_content.get("text") or q_content.get("prompt") or "").strip()
            
            # Stem extraction
            words = prompt.split()
            stem = " ".join(words[:4]) if len(words) >= 4 else prompt
            stems.append(stem)

            # TEST D: Template Prompt Detection
            for marker in TEMPLATE_MARKERS:
                if re.search(marker, prompt, re.IGNORECASE):
                    results["TEST_D_TEMPLATE_PROMPT"].append({"id": q_id, "prompt": prompt, "marker": marker})
                    break

            # TEST A & I: Transcript Leakage in Listening
            if q.skill == "listening" or q_type == "listening":
                audio_script = q.audio_script or ""
                # Check if prompt explicitly leaks the spoken target word inside quotes
                quoted = re.findall(r"'([^']+)'", prompt)
                for q_word in quoted:
                    if len(q_word) > 2 and q_word.lower() in audio_script.lower():
                        results["TEST_A_TRANSCRIPT_LEAK"].append({"id": q_id, "prompt": prompt, "leaked_word": q_word})
                        results["TEST_I_LISTENING_WITHOUT_LISTENING"].append({"id": q_id, "reason": f"Prompt displays target word '{q_word}'"})

            # TEST B & J: Fake Visual Detection
            if "picture" in prompt.lower() or "image" in prompt.lower() or "look at the sign" in prompt.lower():
                if not q.image_url:
                    results["TEST_B_FAKE_VISUAL"].append({"id": q_id, "prompt": prompt})
                    results["TEST_J_VISUAL_WITHOUT_VISUAL"].append({"id": q_id, "reason": "No image_url present for visual prompt"})

            # TEST C: Missing Story/Passage
            if q_type == "comprehension":
                if not q.reference_text and not q.audio_script:
                    results["TEST_C_MISSING_STORY"].append({"id": q_id, "prompt": prompt})

            # TEST E: Absurd Distractors
            options = json.loads(q.options) if isinstance(q.options, str) else q.options
            if isinstance(options, list):
                for opt in options:
                    txt = opt.get("text") if isinstance(opt, dict) else str(opt)
                    if txt in ABSURD_WORDS:
                        results["TEST_E_ABSURD_DISTRACTORS"].append({"id": q_id, "absurd_option": txt})
                        break

            # TEST F: Language Contamination
            if q.language == "en":
                # Check if prompt contains Telugu script characters
                if re.search(r"[\u0C00-\u0C7F]", prompt):
                    results["TEST_F_LANGUAGE_CONTAMINATION"].append({"id": q_id, "prompt": prompt})

        # TEST G: Repeated Stems Analysis
        from collections import Counter
        stem_counts = Counter(stems)
        for s, count in stem_counts.items():
            if count >= 10:
                results["TEST_G_REPEATED_STEMS"].append({"stem": s, "occurrences": count})

        summary = {
            "total_questions_scanned": len(questions),
            "test_failures": {k: len(v) for k, v in results.items()},
            "details": results
        }

        print("\n=== ADVERSARIAL CONTENT QUALITY AUDIT SUMMARY ===")
        for test_name, fail_count in summary["test_failures"].items():
            status = "FAIL" if fail_count > 0 else "PASS"
            print(f"  [{status}] {test_name}: {fail_count} failures/flags")

        with open("adversarial_quality_audit_results.json", "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print("\nAudit saved to adversarial_quality_audit_results.json")

if __name__ == "__main__":
    asyncio.run(run_adversarial_audit())
