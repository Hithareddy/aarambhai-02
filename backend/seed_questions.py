"""
Seed sample questions for assessment testing.

This script populates the database with sample questions across
different skills, domains, and difficulty levels.
"""
import asyncio
import json

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.question import Question

# Use the same async driver the application is configured with (psycopg v3).
DATABASE_URL = settings.DATABASE_URL

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# Sample questions data
SAMPLE_QUESTIONS = [
    {
        "id": "q-speaking-greetings-001",
        "learning_goal": "Basic Speaking",
        "domain": "Speaking",
        "skill": "speaking",
        "difficulty": 1,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "How do you greet someone in English?"},
        "options": [
            {"id": "A", "text": "Hello"},
            {"id": "B", "text": "Goodbye"},
            {"id": "C", "text": "Maybe"},
            {"id": "D", "text": "Never"}
        ],
        "correct_answer": "A",
        "tags": ["greetings", "basic"]
    },
    {
        "id": "q-speaking-introduction-001",
        "learning_goal": "Basic Speaking",
        "domain": "Speaking",
        "skill": "speaking",
        "difficulty": 2,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "How do you introduce yourself formally?"},
        "options": [
            {"id": "A", "text": "Hey, I'm..."},
            {"id": "B", "text": "My name is..."},
            {"id": "C", "text": "Yo..."},
            {"id": "D", "text": "What's up..."}
        ],
        "correct_answer": "B",
        "tags": ["introduction", "formal"]
    },
    {
        "id": "q-reading-alphabet-001",
        "learning_goal": "Basic Reading",
        "domain": "Reading",
        "skill": "reading",
        "difficulty": 1,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "What is the first letter of the English alphabet?"},
        "options": [
            {"id": "A", "text": "A"},
            {"id": "B", "text": "B"},
            {"id": "C", "text": "C"},
            {"id": "D", "text": "D"}
        ],
        "correct_answer": "A",
        "tags": ["alphabet", "basic"]
    },
    {
        "id": "q-reading-words-001",
        "learning_goal": "Basic Reading",
        "domain": "Reading",
        "skill": "reading",
        "difficulty": 2,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Which word means 'happy'?"},
        "options": [
            {"id": "A", "text": "Sad"},
            {"id": "B", "text": "Joyful"},
            {"id": "C", "text": "Angry"},
            {"id": "D", "text": "Tired"}
        ],
        "correct_answer": "B",
        "tags": ["vocabulary", "emotions"]
    },
    {
        "id": "q-writing-letters-001",
        "learning_goal": "Basic Writing",
        "domain": "Writing",
        "skill": "writing",
        "difficulty": 1,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Which letter is a vowel?"},
        "options": [
            {"id": "A", "text": "B"},
            {"id": "B", "text": "C"},
            {"id": "C", "text": "A"},
            {"id": "D", "text": "D"}
        ],
        "correct_answer": "C",
        "tags": ["letters", "vowels"]
    },
    {
        "id": "q-writing-sentences-001",
        "learning_goal": "Basic Writing",
        "domain": "Writing",
        "skill": "writing",
        "difficulty": 2,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Which is a complete sentence?"},
        "options": [
            {"id": "A", "text": "The cat"},
            {"id": "B", "text": "The cat sat"},
            {"id": "C", "text": "Sat on mat"},
            {"id": "D", "text": "Cat the"}
        ],
        "correct_answer": "B",
        "tags": ["sentences", "grammar"]
    },
    {
        "id": "q-listening-sounds-001",
        "learning_goal": "Basic Listening",
        "domain": "Listening",
        "skill": "listening",
        "difficulty": 1,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "What sound does a dog make?"},
        "options": [
            {"id": "A", "text": "Meow"},
            {"id": "B", "text": "Bark"},
            {"id": "C", "text": "Moo"},
            {"id": "D", "text": "Tweet"}
        ],
        "correct_answer": "B",
        "tags": ["sounds", "animals"]
    },
    {
        "id": "q-listening-comprehension-001",
        "learning_goal": "Basic Listening",
        "domain": "Listening",
        "skill": "listening",
        "difficulty": 2,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "If someone says 'I'm fine', how are they feeling?"},
        "options": [
            {"id": "A", "text": "Very sick"},
            {"id": "B", "text": "Okay"},
            {"id": "C", "text": "Terrible"},
            {"id": "D", "text": "Angry"}
        ],
        "correct_answer": "B",
        "tags": ["comprehension", "feelings"]
    },
    {
        "id": "q-vocabulary-family-001",
        "learning_goal": "Vocabulary",
        "domain": "Vocabulary",
        "skill": "vocabulary",
        "difficulty": 1,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Who is your mother's mother?"},
        "options": [
            {"id": "A", "text": "Aunt"},
            {"id": "B", "text": "Grandmother"},
            {"id": "C", "text": "Sister"},
            {"id": "D", "text": "Cousin"}
        ],
        "correct_answer": "B",
        "tags": ["family", "relationships"]
    },
    {
        "id": "q-vocabulary-food-001",
        "learning_goal": "Vocabulary",
        "domain": "Vocabulary",
        "skill": "vocabulary",
        "difficulty": 2,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Which is a fruit?"},
        "options": [
            {"id": "A", "text": "Carrot"},
            {"id": "B", "text": "Potato"},
            {"id": "C", "text": "Apple"},
            {"id": "D", "text": "Onion"}
        ],
        "correct_answer": "C",
        "tags": ["food", "classification"]
    },
    {
        "id": "q-grammar-articles-001",
        "learning_goal": "Grammar",
        "domain": "Grammar",
        "skill": "grammar",
        "difficulty": 1,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Which article goes with 'apple'?"},
        "options": [
            {"id": "A", "text": "a"},
            {"id": "B", "text": "an"},
            {"id": "C", "text": "the"},
            {"id": "D", "text": "no article"}
        ],
        "correct_answer": "B",
        "tags": ["articles", "grammar"]
    },
    {
        "id": "q-grammar-tenses-001",
        "learning_goal": "Grammar",
        "domain": "Grammar",
        "skill": "grammar",
        "difficulty": 2,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Which is past tense?"},
        "options": [
            {"id": "A", "text": "Run"},
            {"id": "B", "text": "Running"},
            {"id": "C", "text": "Ran"},
            {"id": "D", "text": "Will run"}
        ],
        "correct_answer": "C",
        "tags": ["tenses", "grammar"]
    },
    {
        "id": "q-pronunciation-sounds-001",
        "learning_goal": "Pronunciation",
        "domain": "Pronunciation",
        "skill": "pronunciation",
        "difficulty": 1,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Which word has a long 'a' sound?"},
        "options": [
            {"id": "A", "text": "Cat"},
            {"id": "B", "text": "Cake"},
            {"id": "C", "text": "Car"},
            {"id": "D", "text": "Cap"}
        ],
        "correct_answer": "B",
        "tags": ["sounds", "pronunciation"]
    },
    {
        "id": "q-pronunciation-stress-001",
        "learning_goal": "Pronunciation",
        "domain": "Pronunciation",
        "skill": "pronunciation",
        "difficulty": 2,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Which syllable is stressed in 'banana'?"},
        "options": [
            {"id": "A", "text": "First"},
            {"id": "B", "text": "Second"},
            {"id": "C", "text": "Third"},
            {"id": "D", "text": "None"}
        ],
        "correct_answer": "B",
        "tags": ["stress", "pronunciation"]
    },
    {
        "id": "q-conversations-shopping-001",
        "learning_goal": "Conversations",
        "domain": "Conversations",
        "skill": "conversations",
        "difficulty": 1,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "What do you say when buying something?"},
        "options": [
            {"id": "A", "text": "Goodbye"},
            {"id": "B", "text": "How much?"},
            {"id": "C", "text": "Hello"},
            {"id": "D", "text": "Thank you"}
        ],
        "correct_answer": "B",
        "tags": ["shopping", "conversations"]
    },
    {
        "id": "q-conversations-help-001",
        "learning_goal": "Conversations",
        "domain": "Conversations",
        "skill": "conversations",
        "difficulty": 2,
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "How do you politely ask for help?"},
        "options": [
            {"id": "A", "text": "Help me now!"},
            {"id": "B", "text": "Could you help me, please?"},
            {"id": "C", "text": "Give me help"},
            {"id": "D", "text": "I need help"}
        ],
        "correct_answer": "B",
        "tags": ["help", "politeness"]
    }
]


async def seed_questions():
    """Seed the database with sample questions."""
    async with AsyncSessionLocal() as session:
        try:
            # Check if questions already exist
            from sqlalchemy import select
            existing = await session.execute(select(Question).limit(1))
            if existing.scalar_one_or_none():
                print("Questions already exist in database. Skipping seed.")
                return

            # Add sample questions
            for q_data in SAMPLE_QUESTIONS:
                question = Question(
                    id=q_data["id"],
                    learning_goal=q_data["learning_goal"],
                    domain=q_data["domain"],
                    skill=q_data["skill"],
                    difficulty=q_data["difficulty"],
                    question_type=q_data["question_type"],
                    language=q_data["language"],
                    question_content=json.dumps(q_data["question_content"]),
                    options=json.dumps(q_data["options"]),
                    correct_answer=json.dumps(q_data["correct_answer"]),
                    is_active=True,
                    tags=json.dumps(q_data["tags"])
                )
                session.add(question)
                print(f"Added question: {q_data['id']}")

            await session.commit()
            print(f"Successfully seeded {len(SAMPLE_QUESTIONS)} questions!")

        except Exception as e:
            await session.rollback()
            print(f"Error seeding questions: {e}")
            raise


if __name__ == "__main__":
    print("Starting question seeding...")
    asyncio.run(seed_questions())
    print("Seeding complete!")
