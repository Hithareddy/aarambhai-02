import asyncio
import json
import os
import sys
import uuid

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select, update
from app.db.session import async_session_factory
from app.models.question import Question
from app.models.translation import ContentTranslation

# Instruction translations for UI support across regional languages
INSTRUCTION_TRANSLATIONS = {
    "te": {
        "Listen carefully. Which word did you hear?": "శ్రద్ధగా వినండి. మీరు ఏ పదాన్ని విన్నారు?",
        "Listen to the speaker's request. Where do they want to go?": "స్పీకర్ అభ్యర్థనను వినండి. వారు ఎక్కడికి వెళ్లాలనుకుంటున్నారు?",
        "Listen to the station announcement. Which platform is the train arriving on?": "స్టేషన్ ప్రకటనను వినండి. రైలు ఏ ప్లాట్‌ఫారమ్‌కు వస్తోంది?",
        "Listen to the phone message. What time is the clinic consultation rescheduled for?": "ఫోన్ సందేశాన్ని వినండి. క్లినిక్ సంప్రదింపు ఏ సమయానికి మార్చబడింది?",
        "Listen to the corporate advisory. What key action is recommended?": "కార్పొరేట్ సలహాను వినండి. ఏ ముఖ్యమైన చర్య సిఫార్సు చేయబడింది?",
        "Tap the microphone and read this greeting aloud:": "మైక్రోఫోన్‌ను నొక్కి ఈ అభినందనను బిగ్గరగా చదవండి:",
        "Imagine you are at the bus station. Ask where to buy a ticket:": "మీరు బస్సు స్టేషన్‌లో ఉన్నారని ఊహించుకోండి. టికెట్ ఎక్కడ కొనాలో అడగండి:",
        "Introduce yourself to a new colleague at work:": "పని ప్రదేశంలో కొత్త సహోద్యోగికి మిమ్మల్ని పరిచయం చేసుకోండి:",
        "Look at the sign. What does it mean?": "సంకేతాన్ని చూడండి. దీని అర్థం ఏమిటి?",
        "What is the safest action when you see this warning sign?": "ఈ హెచ్చరిక బోర్డు చూసినప్పుడు సురక్షితమైన చర్య ఏది?",
        "Read the train station timetable. Which platform does the train depart from?": "రైలు స్టేషన్ టైమ్‌టేబుల్ చూడండి. రైలు ఏ ప్లాట్‌ఫామ్ నుండి బయలుదేరుతుంది?",
        "Arrange the words to form a correct sentence:": "సరైన వాక్యాన్ని రూపొందించడానికి పదాలను అమర్చండి:",
        "Reorder these scrambled words into a proper English sentence:": "ఈ పదాలను సరైన ఇంగ్లీష్ వాక్యంగా అమర్చండి:"
    },
    "hi": {
        "Listen carefully. Which word did you hear?": "ध्यान से सुनें। आपने कौन सा शब्द सुना?",
        "Tap the microphone and read this greeting aloud:": "माइक दबाएं और इस अभिवादन को जोर से पढ़ें:",
        "Look at the sign. What does it mean?": "साइन देखें। इसका क्या मतलब है?",
        "Arrange the words to form a correct sentence:": "सही वाक्य बनाने के लिए शब्दों को व्यवस्थित करें:"
    }
}

async def seed_certified_catalogue():
    print("Executing Part 5C Step 3: Integrating Certified V5 Catalogue into PostgreSQL...")
    
    catalogue_path = os.path.abspath("curated_assessment_catalogue_v5.json")
    with open(catalogue_path, "r", encoding="utf-8") as f:
        catalogue_data = json.load(f)
        items = catalogue_data["items"]

    async with async_session_factory() as session:
        # Step A: Inactivate legacy / non-certified questions
        print("Archiving legacy question bank rows (is_active = False)...")
        await session.execute(
            update(Question)
            .values(is_active=False)
        )
        await session.commit()

        # Step B: Upsert 120 certified items cleanly
        print(f"Upserting {len(items)} certified v5 items...")
        inserted_count = 0
        updated_count = 0

        for q in items:
            qid = q["id"]
            
            # Build tags array
            tags_list = [
                "source:certified_v5",
                f"scenario:{q['scenario_family']}",
                f"type:{q['question_type']}",
                f"subskill:{q['subskill']}"
            ] + q.get("role_tags", []) + q.get("age_group_tags", [])
            
            # Question content JSON
            qc_json = json.dumps({
                "text": q["visible_instruction"],
                "instruction": q["visible_instruction"],
                "stimulus": q["stimulus"],
                "visible_instruction": q["visible_instruction"]
            }, ensure_ascii=False)
            
            options_json = json.dumps(q["options"], ensure_ascii=False) if q["options"] else "[]"
            correct_ans_json = json.dumps(q["correct_answer"], ensure_ascii=False)
            keywords_json = json.dumps(q["expected_keywords"], ensure_ascii=False) if q.get("expected_keywords") else None
            tags_json = json.dumps(tags_list, ensure_ascii=False)

            stmt_find = select(Question).where(Question.id == qid)
            res_find = await session.execute(stmt_find)
            existing_q = res_find.scalar_one_or_none()

            age_group_val = json.dumps(q.get("age_group_tags", []))
            edu_level_val = json.dumps(q.get("education_tags", []))
            learner_type_val = json.dumps(q.get("role_tags", []))
            topic_cat_val = q.get("scenario_family")
            lang_val = q.get("learning_language", "en")

            if existing_q:
                existing_q.learning_goal = "Initial Assessment"
                existing_q.domain = q["scenario_family"]
                existing_q.skill = q["skill"]
                existing_q.difficulty = q["difficulty"]
                existing_q.question_type = q["question_type"]
                existing_q.language = lang_val
                existing_q.age_group = age_group_val
                existing_q.education_level = edu_level_val
                existing_q.learner_type = learner_type_val
                existing_q.topic_category = topic_cat_val
                existing_q.question_content = qc_json
                existing_q.options = options_json
                existing_q.correct_answer = correct_ans_json
                existing_q.audio_script = q.get("hidden_audio_script")
                existing_q.reference_text = q.get("speaking_reference")
                existing_q.expected_keywords = keywords_json
                existing_q.image_url = q.get("image_url")
                existing_q.is_active = True
                existing_q.tags = tags_json
                updated_count += 1
            else:
                new_q = Question(
                    id=qid,
                    learning_goal="Initial Assessment",
                    domain=q["scenario_family"],
                    skill=q["skill"],
                    difficulty=q["difficulty"],
                    question_type=q["question_type"],
                    language=lang_val,
                    age_group=age_group_val,
                    education_level=edu_level_val,
                    learner_type=learner_type_val,
                    topic_category=topic_cat_val,
                    question_content=qc_json,
                    options=options_json,
                    correct_answer=correct_ans_json,
                    audio_script=q.get("hidden_audio_script"),
                    reference_text=q.get("speaking_reference"),
                    expected_keywords=keywords_json,
                    image_url=q.get("image_url"),
                    is_active=True,
                    tags=tags_json
                )
                session.add(new_q)
                inserted_count += 1

        await session.commit()

        # Step C: Seed Content Translations for UI instruction language support
        print("Seeding UI support translations for regional languages...")
        trans_count = 0
        for lang_code, trans_map in INSTRUCTION_TRANSLATIONS.items():
            for orig_text, trans_text in trans_map.items():
                # Find matching question IDs
                for q in items:
                    if q["visible_instruction"] == orig_text:
                        qid = q["id"]
                        stmt_t = select(ContentTranslation).where(
                            ContentTranslation.entity_type == "question",
                            ContentTranslation.entity_id == qid,
                            ContentTranslation.language_code == lang_code
                        )
                        res_t = await session.execute(stmt_t)
                        existing_t = res_t.scalar_one_or_none()
                        
                        tf_json = json.dumps({"question_text": trans_text, "visible_instruction": trans_text}, ensure_ascii=False)
                        
                        if existing_t:
                            existing_t.translated_fields = tf_json
                        else:
                            new_t = ContentTranslation(
                                id=str(uuid.uuid4()),
                                entity_type="question",
                                entity_id=qid,
                                language_code=lang_code,
                                translated_fields=tf_json
                            )
                            session.add(new_t)
                            trans_count += 1

        await session.commit()

        print(f"\n=== CERTIFIED V5 CATALOGUE SEEDING COMPLETE ===")
        print(f"Inserted Questions: {inserted_count}")
        print(f"Updated Questions: {updated_count}")
        print(f"Total Active Questions in DB: {inserted_count + updated_count}")
        print(f"New Translations Added: {trans_count}")

if __name__ == "__main__":
    asyncio.run(seed_certified_catalogue())
