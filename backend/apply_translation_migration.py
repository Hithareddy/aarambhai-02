import asyncio
import json
import traceback
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings


async def main():
    try:
        print(f"DATABASE_URL: {settings.DATABASE_URL}")
        engine = create_async_engine(settings.DATABASE_URL, connect_args={"statement_cache_size": 0})
        async with engine.connect() as conn:
            # 1. Create content_translations table if not exists
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS content_translations (
                    id VARCHAR(36) PRIMARY KEY,
                    entity_type VARCHAR(50) NOT NULL,
                    entity_id VARCHAR(36) NOT NULL,
                    language_code VARCHAR(10) NOT NULL,
                    translated_fields TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_content_translations_lookup 
                ON content_translations (entity_type, entity_id, language_code);
            """))
            await conn.commit()
            print("Table content_translations is ready.")

            # 2. Seed Telugu translations
            translations = [
                {
                    "entity_id": "q-speaking-greetings-001",
                    "translated_fields": {
                        "question_text": "ఇంగ్లీషులో ఎవరినైనా ఎలా పలకరిస్తారు?",
                        "option_a": "హలో (Hello)",
                        "option_b": "గుడ్ బై (Goodbye)",
                        "option_c": "బహుశా (Maybe)",
                        "option_d": "ఎప్పటికీ కాదు (Never)",
                        "correct_answer": "A"
                    }
                },
                {
                    "entity_id": "q-speaking-introduction-001",
                    "translated_fields": {
                        "question_text": "మిమ్మల్ని మీరు అధికారికంగా ఎలా పరిచయం చేసుకుంటారు?",
                        "option_a": "హేయ్, నేను... (Hey, I'm...)",
                        "option_b": "నా పేరు... (My name is...)",
                        "option_c": "యో... (Yo...)",
                        "option_d": "ఏంటి సంగతులు... (What's up...)",
                        "correct_answer": "B"
                    }
                },
                {
                    "entity_id": "q-reading-alphabet-001",
                    "translated_fields": {
                        "question_text": "ఇంగ్లీష్ వర్ణమాలలో మొదటి అక్షరం ఏది?",
                        "option_a": "A",
                        "option_b": "B",
                        "option_c": "C",
                        "option_d": "D",
                        "correct_answer": "A"
                    }
                },
                {
                    "entity_id": "q-reading-words-001",
                    "translated_fields": {
                        "question_text": "ఏ పదం 'సంతోషం' అనే అర్థాన్ని ఇస్తుంది?",
                        "option_a": "విచారం (Sad)",
                        "option_b": "సంతోషం (Joyful)",
                        "option_c": "కోపం (Angry)",
                        "option_d": "అలసట (Tired)",
                        "correct_answer": "B"
                    }
                },
                {
                    "entity_id": "q-writing-letters-001",
                    "translated_fields": {
                        "question_text": "కింది వాటిలో ఏ అక్షరం అచ్చు (vowel)?",
                        "option_a": "B",
                        "option_b": "C",
                        "option_c": "A",
                        "option_d": "D",
                        "correct_answer": "C"
                    }
                },
                {
                    "entity_id": "q-writing-sentences-001",
                    "translated_fields": {
                        "question_text": "కింది వాటిలో ఏది సంపూర్ణ వాక్యం?",
                        "option_a": "పిల్లి (The cat)",
                        "option_b": "పిల్లి కూర్చుంది (The cat sat)",
                        "option_c": "చాప మీద కూర్చుంది (Sat on mat)",
                        "option_d": "పిల్లి ది (Cat the)",
                        "correct_answer": "B"
                    }
                },
                {
                    "entity_id": "q-listening-sounds-001",
                    "translated_fields": {
                        "question_text": "కుక్క ఎలాంటి శబ్దం చేస్తుంది?",
                        "option_a": "మ్యావ్ (Meow)",
                        "option_b": "మొరగడం (Bark)",
                        "option_c": "అంబా (Moo)",
                        "option_d": "కిలకిల (Tweet)",
                        "correct_answer": "B"
                    }
                },
                {
                    "entity_id": "q-listening-comprehension-001",
                    "translated_fields": {
                        "question_text": "ఎవరైనా 'నేను బాగున్నాను' అని చెప్తే, వారి భావన ఏమిటి?",
                        "option_a": "బాగా జబ్బు పడడం (Very sick)",
                        "option_b": "పర్వాలేదు/బాగున్నాను (Okay)",
                        "option_c": "చాలా ఘోరంగా (Terrible)",
                        "option_d": "కోపంగా (Angry)",
                        "correct_answer": "B"
                    }
                },
                {
                    "entity_id": "q-vocabulary-family-001",
                    "translated_fields": {
                        "question_text": "మీ అమ్మగారి అమ్మ మీకు ఏమవుతారు?",
                        "option_a": "అత్త/పిన్ని (Aunt)",
                        "option_b": "అమ్మమ్మ (Grandmother)",
                        "option_c": "సోదరి (Sister)",
                        "option_d": "బంధువు (Cousin)",
                        "correct_answer": "B"
                    }
                },
                {
                    "entity_id": "q-vocabulary-food-001",
                    "translated_fields": {
                        "question_text": "కింది వాటిలో పండు ఏది?",
                        "option_a": "క్యారెట్ (Carrot)",
                        "option_b": "బంగాళాదుంప (Potato)",
                        "option_c": "ఆపిల్ (Apple)",
                        "option_d": "ఉల్లిపాయ (Onion)",
                        "correct_answer": "C"
                    }
                },
                {
                    "entity_id": "q-grammar-articles-001",
                    "translated_fields": {
                        "question_text": "'apple' అనే పదంతో ఏ ఆర్టికల్ ఉపయోగించబడుతుంది?",
                        "option_a": "a",
                        "option_b": "an",
                        "option_c": "the",
                        "option_d": "ఏ ఆర్టికల్ లేదు (no article)",
                        "correct_answer": "B"
                    }
                },
                {
                    "entity_id": "q-grammar-tenses-001",
                    "translated_fields": {
                        "question_text": "కింది వాటిలో ఏది భూతకాలం (past tense)?",
                        "option_a": "పరుగెత్తు (Run)",
                        "option_b": "పరుగెత్తుతున్నాడు (Running)",
                        "option_c": "పరుగెత్తాడు (Ran)",
                        "option_d": "పరుగెత్తుతాడు (Will run)",
                        "correct_answer": "C"
                    }
                }
            ]

            for item in translations:
                # Upsert by deleting existing ones first
                await conn.execute(
                    text("DELETE FROM content_translations WHERE entity_type = 'question' AND entity_id = :eid AND language_code = 'te'"),
                    {"eid": item["entity_id"]}
                )
                await conn.execute(
                    text("""
                        INSERT INTO content_translations (id, entity_type, entity_id, language_code, translated_fields)
                        VALUES (:id, 'question', :eid, 'te', :fields)
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "eid": item["entity_id"],
                        "fields": json.dumps(item["translated_fields"])
                    }
                )
            await conn.commit()
            print("Successfully seeded 12 Telugu translations for logical questions.")

    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
