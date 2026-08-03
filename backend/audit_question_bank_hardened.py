import asyncio
import json
import re
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.question import Question
from app.models.translation import ContentTranslation

VALID_SKILLS = {
    "listening", "speaking", "reading", "writing",
    "vocabulary", "grammar", "pronunciation", "conversations"
}

SUPPORTED_QUESTION_TYPES = {
    "mcq", "true_false", "fill_blank", "arrange", "arrange_words", "arrange_letters",
    "match", "matching", "comprehension", "listening", "listening_image", "listening_mcq",
    "speaking", "read_select", "read_sentence", "road_signs", "everyday_communication",
    "shopping", "bus_stand", "atm", "medicine_label", "weather", "time_clock",
    "odd_one_out", "categorization", "image_mcq", "picture_id", "image_select",
    "fruit_id", "vegetable_id", "bird_id", "vehicle_id", "object_id", "color_id"
}

async def run_audit():
    report = {
        "total_questions": 0,
        "valid_questions": 0,
        "invalid_questions": 0,
        "warning_questions": 0,
        "failures_by_category": {
            "MISSING_CONTENT": [],
            "MEDIA": [],
            "ANSWER_INTEGRITY": [],
            "LANGUAGE": [],
            "QUESTION_TYPE": [],
            "PROFILE_DIFFICULTY": [],
            "SEMANTIC_INCONSISTENCY": []
        },
        "media_health": {
            "listening": {"total": 0, "usable": 0, "missing": 0},
            "image": {"total": 0, "usable": 0, "missing": 0},
            "speaking": {"total": 0, "usable": 0, "missing": 0},
            "comprehension": {"total": 0, "usable": 0, "missing": 0}
        },
        "invalid_details": []
    }

    async with async_session_factory() as db:
        q_res = await db.execute(select(Question))
        questions = q_res.scalars().all()
        
        t_res = await db.execute(select(ContentTranslation).where(ContentTranslation.entity_type == "question"))
        translations = t_res.scalars().all()
        
        translations_by_q = {}
        for t in translations:
            if t.entity_id not in translations_by_q:
                translations_by_q[t.entity_id] = []
            translations_by_q[t.entity_id].append(t)

        report["total_questions"] = len(questions)

        for q in questions:
            q_id = str(q.id)
            q_type = q.question_type
            issues = []
            warnings = []

            # 1. Parse JSON fields
            prompt_text = ""
            try:
                content = json.loads(q.question_content) if isinstance(q.question_content, str) else q.question_content
                if isinstance(content, dict):
                    prompt_text = content.get("text") or content.get("prompt") or ""
                elif isinstance(content, str):
                    prompt_text = content
            except Exception as e:
                issues.append(("MISSING_CONTENT", f"Malformed question_content JSON: {e}"))

            options = []
            try:
                options = json.loads(q.options) if isinstance(q.options, str) else q.options
            except Exception as e:
                issues.append(("ANSWER_INTEGRITY", f"Malformed options JSON: {e}"))

            correct_ans = None
            try:
                correct_ans = json.loads(q.correct_answer) if isinstance(q.correct_answer, str) else q.correct_answer
            except Exception as e:
                issues.append(("ANSWER_INTEGRITY", f"Malformed correct_answer JSON: {e}"))

            # 2. Basic Question Type Validation
            if q_type not in SUPPORTED_QUESTION_TYPES:
                issues.append(("QUESTION_TYPE", f"Unsupported question_type '{q_type}'"))

            # 3. Difficulty & Skill Validation
            if q.difficulty < 1 or q.difficulty > 5:
                issues.append(("PROFILE_DIFFICULTY", f"Difficulty {q.difficulty} outside supported range 1-5"))
            
            if q.skill and q.skill.lower() not in VALID_SKILLS:
                warnings.append(("PROFILE_DIFFICULTY", f"Skill '{q.skill}' not in standard LSRW set"))

            # 4. Prompt text check
            if not prompt_text or not prompt_text.strip():
                issues.append(("MISSING_CONTENT", "Missing or empty question prompt text"))

            # 5. Media Requirements & Tracking
            is_listening_req = (
                q_type in ["listening", "listening_image", "listening_mcq"] or
                q.skill == "listening" or
                bool(re.search(r'\b(listen|hear|audio|sound)\b', prompt_text, re.IGNORECASE))
            )
            if is_listening_req:
                report["media_health"]["listening"]["total"] += 1
                has_audio = bool(q.audio_url and q.audio_url.strip()) or bool(q.audio_script and q.audio_script.strip())
                if has_audio:
                    report["media_health"]["listening"]["usable"] += 1
                else:
                    report["media_health"]["listening"]["missing"] += 1
                    issues.append(("MEDIA", "Listening question/prompt has no audio_url or audio_script"))

            is_image_req = (
                q_type in ["image_mcq", "picture_id", "image_select", "road_signs", "fruit_id", "vegetable_id"] or
                bool(re.search(r'\b(picture|image|photo|look at)\b', prompt_text, re.IGNORECASE))
            )
            if is_image_req:
                report["media_health"]["image"]["total"] += 1
                has_opt_img = isinstance(options, list) and any(isinstance(o, dict) and o.get("image") for o in options)
                has_img = bool(q.image_url and q.image_url.strip()) or has_opt_img
                if has_img:
                    report["media_health"]["image"]["usable"] += 1
                else:
                    report["media_health"]["image"]["missing"] += 1
                    issues.append(("MEDIA", "Image question/prompt has no image_url or option images"))

            is_speaking_req = (q_type == "speaking" or q.skill == "speaking")
            if is_speaking_req:
                report["media_health"]["speaking"]["total"] += 1
                has_speaking_ref = bool(q.reference_text and q.reference_text.strip()) or bool(q.audio_script and q.audio_script.strip()) or bool(prompt_text.strip())
                if has_speaking_ref:
                    report["media_health"]["speaking"]["usable"] += 1
                else:
                    report["media_health"]["speaking"]["missing"] += 1
                    issues.append(("MEDIA", "Speaking question missing reference_text or evaluation prompt"))

            is_comprehension_req = (
                q_type == "comprehension" or
                bool(re.search(r'\b(passage|story|paragraph|dialogue|conversation)\b', prompt_text, re.IGNORECASE))
            )
            if is_comprehension_req:
                report["media_health"]["comprehension"]["total"] += 1
                has_context = (
                    bool(q.reference_text and q.reference_text.strip()) or
                    bool(q.audio_script and q.audio_script.strip()) or
                    "Passage:" in prompt_text or "Story:" in prompt_text or "Dialogue:" in prompt_text
                )
                if has_context:
                    report["media_health"]["comprehension"]["usable"] += 1
                else:
                    report["media_health"]["comprehension"]["missing"] += 1
                    issues.append(("MISSING_CONTENT", "Comprehension question references passage/story but no story text or reference_text is provided"))

            # 6. Answer Integrity
            if q_type in ["mcq", "true_false", "fill_blank", "image_mcq", "picture_id", "odd_one_out", "read_select"]:
                if not isinstance(options, list) or len(options) == 0:
                    issues.append(("ANSWER_INTEGRITY", f"Question type '{q_type}' requires non-empty options array"))
                else:
                    opt_ids = [str(o.get("id")) if isinstance(o, dict) else str(o) for o in options]
                    opt_texts = [str(o.get("text")) if isinstance(o, dict) else str(o) for o in options]
                    
                    # Duplicate option check
                    if len(opt_texts) != len(set(opt_texts)):
                        warnings.append(("ANSWER_INTEGRITY", "Duplicate option texts detected"))

                    # Match correct_answer against options
                    if correct_ans is None or str(correct_ans).strip() == "":
                        issues.append(("ANSWER_INTEGRITY", "Missing correct_answer"))
                    else:
                        cand = str(correct_ans).strip()
                        matches = (cand in opt_ids) or (cand in opt_texts) or (cand.lower() in [t.lower() for t in opt_texts])
                        if not matches:
                            issues.append(("ANSWER_INTEGRITY", f"correct_answer '{correct_ans}' does not correspond to any available option ({opt_ids} / {opt_texts})"))

            elif q_type in ["arrange", "arrange_words", "arrange_letters"]:
                if not isinstance(options, list) or len(options) == 0:
                    issues.append(("ANSWER_INTEGRITY", "Arrange question requires non-empty options/words array"))
                if correct_ans is None:
                    issues.append(("ANSWER_INTEGRITY", "Arrange question missing correct_answer ordering"))

            elif q_type in ["match", "matching"]:
                q_content_obj = content if isinstance(content, dict) else {}
                matching_pairs = q_content_obj.get("matchingPairs")
                if not matching_pairs and not isinstance(options, list):
                    issues.append(("ANSWER_INTEGRITY", "Matching question missing matchingPairs or options"))

            # 7. Language Consistency
            if not q.language:
                issues.append(("LANGUAGE", "Missing base language metadata"))

            q_trans = translations_by_q.get(q_id, [])
            for t in q_trans:
                try:
                    t_fields = json.loads(t.translated_fields) if isinstance(t.translated_fields, str) else t.translated_fields
                    if not isinstance(t_fields, dict):
                        issues.append(("LANGUAGE", f"Translation for '{t.language_code}' is not a valid JSON dict"))
                except Exception as e:
                    issues.append(("LANGUAGE", f"Malformed translation JSON for '{t.language_code}': {e}"))

            # Record final status for question
            if len(issues) > 0:
                report["invalid_questions"] += 1
                for cat, msg in issues:
                    report["failures_by_category"][cat].append({"id": q_id, "type": q_type, "message": msg})
                report["invalid_details"].append({"id": q_id, "type": q_type, "issues": issues, "warnings": warnings})
            elif len(warnings) > 0:
                report["valid_questions"] += 1
                report["warning_questions"] += 1
            else:
                report["valid_questions"] += 1

    print("=== QUESTION BANK AUDIT SUMMARY ===")
    print(f"Total Questions: {report['total_questions']}")
    print(f"Valid Questions: {report['valid_questions']}")
    print(f"Invalid Questions: {report['invalid_questions']}")
    print(f"Warning Questions: {report['warning_questions']}")
    print("\nMedia Health:")
    print(json.dumps(report["media_health"], indent=2))
    print("\nFailures by Category Counts:")
    for cat, list_items in report["failures_by_category"].items():
        print(f"  {cat}: {len(list_items)}")

    with open("question_bank_health_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print("\nFull health report written to question_bank_health_report.json")

if __name__ == "__main__":
    import sys
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_audit())
