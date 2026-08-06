"""
Seed the curated persona content pack into the question bank.

Idempotent: rows are keyed by their stable ``PP-*`` ids, so re-running updates
in place. Run from the ``backend`` directory:

    python seed_persona_pack.py
"""
import asyncio
import json
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select

from app.data.persona_content_pack import iter_items
from app.db.session import async_session_factory
from app.models.question import Question

SPEAKING_TYPES = {"short_response", "situational_response", "greeting_introduction",
                  "extended_response"}

PERSONA_AGE_GROUPS = {
    "early_learner": "under_12",
    "school_student": "12_17",
    "college_student": "18_24",
    "professional": "25_45",
    "homemaker": "25_45",
    "senior_citizen": "60_plus",
}
PERSONA_EDUCATION = {
    "early_learner": "primary",
    "school_student": "secondary",
    "college_student": "college",
    "professional": "graduate",
    "homemaker": "general",
    "senior_citizen": "general",
}
PERSONA_GOALS = {
    "early_learner": "education",
    "school_student": "education",
    "college_student": "workplace",
    "professional": "workplace",
    "homemaker": "everyday_communication",
    "senior_citizen": "everyday_communication",
}
DIFFICULTY_LEVELS = {1: "beginner", 2: "elementary", 3: "intermediate",
                     4: "upper_intermediate", 5: "advanced"}


async def seed() -> None:
    rows = iter_items()
    print(f"Seeding {len(rows)} curated persona questions...")

    created = updated = 0
    async with async_session_factory() as session:
        for item in rows:
            persona = item["persona"]
            qtype = item["question_type"]
            is_speaking = item["skill"] == "speaking" or qtype in SPEAKING_TYPES

            options = [
                {"id": chr(65 + i), "text": text}
                for i, text in enumerate(item["options"])
            ]

            content = {
                "instruction": item["instruction"],
                "prompt": item["prompt"],
                "text": item["prompt"] or item["instruction"],
                "context": item["context"],
                "persona": persona,
            }

            tags = [
                "source:persona_pack_v1",
                f"context:{item['context']}",
                f"skill:{item['skill']}",
            ] + [f"persona:{p}" for p in item["personas"]]

            values = dict(
                learning_goal=PERSONA_GOALS.get(persona, "everyday_communication"),
                domain=item["context"],
                skill=item["skill"],
                difficulty=item["difficulty"],
                proficiency_level=DIFFICULTY_LEVELS[item["difficulty"]],
                age_group=PERSONA_AGE_GROUPS.get(persona),
                education_level=PERSONA_EDUCATION.get(persona),
                learner_type=json.dumps(item["personas"], ensure_ascii=False),
                topic_category=item["context"],
                question_type=qtype,
                language="en",
                question_content=json.dumps(content, ensure_ascii=False),
                options=json.dumps(options, ensure_ascii=False),
                correct_answer=json.dumps(item["correct_answer"], ensure_ascii=False),
                audio_script=item["audio_script"],
                reference_text=item["correct_answer"] if is_speaking else None,
                max_duration_seconds=30,
                language_code="en-IN",
                is_active=True,
                tags=json.dumps(tags, ensure_ascii=False),
            )

            existing = (
                await session.execute(select(Question).where(Question.id == item["id"]))
            ).scalar_one_or_none()

            if existing:
                for key, value in values.items():
                    setattr(existing, key, value)
                updated += 1
            else:
                session.add(Question(id=item["id"], **values))
                created += 1

        await session.commit()

    print(f"Done. Created {created}, updated {updated}.")


if __name__ == "__main__":
    asyncio.run(seed())
