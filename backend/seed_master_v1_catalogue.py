import asyncio
import json
import os
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select, update
from app.db.session import async_session_factory
from app.models.question import Question

async def seed_master_v1_catalogue():
    print("Executing Phase 1: Importing Aarambh Master Assessment Catalogue V1 (500 Questions)...")
    
    catalogue_path = os.path.abspath("data/aarambh_assessment_master_v1.json")
    with open(catalogue_path, "r", encoding="utf-8") as f:
        catalogue_data = json.load(f)
        questions = catalogue_data["questions"]

    print(f"Loaded master catalogue JSON file with {len(questions)} items.")

    async with async_session_factory() as session:
        # Step 1: Archive/inactivate legacy question bank rows (is_active = False)
        print("Archiving legacy question bank rows (setting is_active = False)...")
        await session.execute(
            update(Question)
            .values(is_active=False)
        )
        await session.commit()

        # Step 2: Idempotent Upsert of 500 Master Questions
        print(f"Upserting {len(questions)} master v1 items into PostgreSQL...")
        inserted_count = 0
        updated_count = 0

        for q in questions:
            qid = q["id"]
            
            # Format options cleanly
            raw_options = q.get("options") or []
            options_list = []
            if isinstance(raw_options, list):
                for idx, opt in enumerate(raw_options):
                    if isinstance(opt, dict):
                        options_list.append(opt)
                    else:
                        letter = chr(65 + idx)
                        options_list.append({"id": letter, "text": str(opt)})
            options_json = json.dumps(options_list, ensure_ascii=False)

            # Format correct_answer
            correct_ans = q.get("correct_answer")
            correct_ans_json = json.dumps(correct_ans, ensure_ascii=False)

            # Build metadata tags array
            tags_list = [
                "source:aarambh_assessment_master_v1",
                "version:1.0",
                f"context:{q.get('context', 'everyday')}",
                f"subskill:{q.get('subskill', 'general')}",
                f"familiarity:{q.get('familiarity', 'beginner')}"
            ]
            tags_list.extend([f"role:{r}" for r in q.get("eligible_roles", [])])
            tags_list.extend([f"age:{a}" for a in q.get("eligible_age_groups", [])])
            tags_list.extend([f"edu:{e}" for e in q.get("eligible_education_levels", [])])
            tags_list.extend([f"goal:{g}" for g in q.get("learning_goals", [])])
            tags_json = json.dumps(tags_list, ensure_ascii=False)

            # Build question_content JSON object
            qc_json = json.dumps({
                "instruction": q.get("instruction"),
                "prompt": q.get("prompt"),
                "text": q.get("prompt") or q.get("instruction"),
                "stimulus": q.get("stimulus"),
                "passage": q.get("passage"),
                "image_spec": q.get("image_spec"),
                "context": q.get("context"),
                "subskill": q.get("subskill"),
                "website_language_behavior": q.get("website_language_behavior"),
                "rationale": q.get("rationale"),
                "media_contract": q.get("media_contract")
            }, ensure_ascii=False)

            # Expected keywords for speaking tasks
            scoring = q.get("scoring") or {}
            exp_keywords = scoring.get("expected_keywords")
            keywords_json = json.dumps(exp_keywords, ensure_ascii=False) if exp_keywords else None

            stmt_find = select(Question).where(Question.id == qid)
            res_find = await session.execute(stmt_find)
            existing_q = res_find.scalar_one_or_none()

            if existing_q:
                existing_q.learning_goal = q.get("learning_goals", ["everyday_communication"])[0]
                existing_q.domain = q.get("context", "everyday")
                existing_q.skill = q["skill"]
                existing_q.difficulty = q["difficulty"]
                existing_q.question_type = q["question_type"]
                existing_q.language = q.get("learning_language", "en")
                existing_q.question_content = qc_json
                existing_q.options = options_json
                existing_q.correct_answer = correct_ans_json
                existing_q.audio_script = q.get("audio_script")
                existing_q.reference_text = q.get("prompt") or q.get("instruction")
                existing_q.expected_keywords = keywords_json
                existing_q.image_url = None  # Image assets to be associated in asset creation phase
                existing_q.is_active = True
                existing_q.tags = tags_json
                updated_count += 1
            else:
                new_q = Question(
                    id=qid,
                    learning_goal=q.get("learning_goals", ["everyday_communication"])[0],
                    domain=q.get("context", "everyday"),
                    skill=q["skill"],
                    difficulty=q["difficulty"],
                    question_type=q["question_type"],
                    language=q.get("learning_language", "en"),
                    question_content=qc_json,
                    options=options_json,
                    correct_answer=correct_ans_json,
                    audio_script=q.get("audio_script"),
                    reference_text=q.get("prompt") or q.get("instruction"),
                    expected_keywords=keywords_json,
                    image_url=None,
                    is_active=True,
                    tags=tags_json
                )
                session.add(new_q)
                inserted_count += 1

        await session.commit()

        print(f"\n=== AARAMBH MASTER V1 SEEDING COMPLETE ===")
        print(f"Inserted Questions: {inserted_count}")
        print(f"Updated Questions: {updated_count}")
        print(f"Total Active Master Questions in DB: {inserted_count + updated_count}")

if __name__ == "__main__":
    asyncio.run(seed_master_v1_catalogue())
