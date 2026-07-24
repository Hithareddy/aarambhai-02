"""
Seed sample questions for assessment testing.

This script populates the database with sample questions across
different skills, domains, and difficulty levels, with deep contextual tags.
"""
import asyncio
import json

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models.question import Question

DATABASE_URL = settings.DATABASE_URL
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# Context-aware sample questions
SAMPLE_QUESTIONS = [
    # ── SPEAKING ──
    {
        "id": "q-speak-greet-child-beg",
        "learning_goal": "Basic Speaking",
        "domain": "Speaking",
        "skill": "speaking",
        "difficulty": 1,
        "proficiency_level": "Beginner",
        "age_group": "Under 12",
        "education_level": "Never went to school",
        "learner_type": "Student",
        "topic_category": "Greetings",
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "How do you say hello to your teacher?"},
        "options": [
            {"id": "A", "text": "Good morning!"},
            {"id": "B", "text": "Goodbye!"},
            {"id": "C", "text": "Money"},
            {"id": "D", "text": "No"}
        ],
        "correct_answer": "A",
        "tags": ["greetings", "child"]
    },
    {
        "id": "q-speak-intro-adult-int",
        "learning_goal": "Basic Speaking",
        "domain": "Speaking",
        "skill": "speaking",
        "difficulty": 3,
        "proficiency_level": "Intermediate",
        "age_group": "26 – 45",
        "education_level": "College",
        "learner_type": "Working professional",
        "topic_category": "Work",
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "How do you introduce yourself at a job interview?"},
        "options": [
            {"id": "A", "text": "Hey, what's up"},
            {"id": "B", "text": "My name is John, I have 5 years of experience."},
            {"id": "C", "text": "I am a boy"},
            {"id": "D", "text": "Goodbye"}
        ],
        "correct_answer": "B",
        "tags": ["introduction", "formal", "work"]
    },

    # ── LISTENING ──
    {
        "id": "q-listen-sounds-child-beg",
        "learning_goal": "Basic Listening",
        "domain": "Listening",
        "skill": "listening",
        "difficulty": 1,
        "proficiency_level": "Beginner",
        "age_group": "Under 12",
        "education_level": "Primary school",
        "learner_type": "Student",
        "topic_category": "Animals",
        "question_type": "mcq",
        "language": "en",
        "audio_script": "The dog says woof woof.",
        "question_content": {"text": "What did you hear about the animal?"},
        "options": [
            {"id": "A", "text": "Cat"},
            {"id": "B", "text": "Dog"},
            {"id": "C", "text": "Cow"},
            {"id": "D", "text": "Bird"}
        ],
        "correct_answer": "B",
        "tags": ["sounds", "animals"]
    },
    {
        "id": "q-listen-directions-adult-beg",
        "learning_goal": "Basic Listening",
        "domain": "Listening",
        "skill": "listening",
        "difficulty": 2,
        "proficiency_level": "Beginner",
        "age_group": "46 – 60",
        "education_level": "Secondary school",
        "learner_type": "Senior citizen",
        "topic_category": "Travel",
        "question_type": "mcq",
        "language": "en",
        "audio_script": "Go straight and turn left at the hospital.",
        "question_content": {"text": "To reach the hospital, where should you turn?"},
        "options": [
            {"id": "A", "text": "Turn right"},
            {"id": "B", "text": "Turn left"},
            {"id": "C", "text": "Go back"},
            {"id": "D", "text": "Stop"}
        ],
        "correct_answer": "B",
        "tags": ["directions", "travel"]
    },

    # ── READING (PROGRESSION) ──
    # Word
    {
        "id": "q-read-word-child-beg",
        "learning_goal": "Reading Words",
        "domain": "Reading",
        "skill": "reading",
        "difficulty": 1,
        "proficiency_level": "Beginner",
        "age_group": "Under 12",
        "education_level": "Never went to school",
        "learner_type": "Student",
        "topic_category": "Colors",
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Read this word: RED. What color is it?"},
        "options": [
            {"id": "A", "text": "Red"},
            {"id": "B", "text": "Blue"},
            {"id": "C", "text": "Green"},
            {"id": "D", "text": "Yellow"}
        ],
        "correct_answer": "A",
        "tags": ["reading", "colors", "word"]
    },
    # Sentence
    {
        "id": "q-read-sentence-adult-elm",
        "learning_goal": "Reading Sentences",
        "domain": "Reading",
        "skill": "reading",
        "difficulty": 2,
        "proficiency_level": "Elementary",
        "age_group": "26 – 45",
        "education_level": "Secondary school",
        "learner_type": "Homemaker",
        "topic_category": "Daily Life",
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Read: 'She goes to the market every morning.' Where does she go?"},
        "options": [
            {"id": "A", "text": "The hospital"},
            {"id": "B", "text": "The market"},
            {"id": "C", "text": "The school"},
            {"id": "D", "text": "The bank"}
        ],
        "correct_answer": "B",
        "tags": ["reading", "sentence"]
    },
    # Paragraph
    {
        "id": "q-read-paragraph-adult-int",
        "learning_goal": "Reading Paragraphs",
        "domain": "Reading",
        "skill": "reading",
        "difficulty": 3,
        "proficiency_level": "Intermediate",
        "age_group": "18 – 25",
        "education_level": "College",
        "learner_type": "Student",
        "topic_category": "General",
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Read the paragraph: 'Water is essential for life. Humans need to drink about eight glasses a day. Plants also need water to grow tall and strong.' Who needs to drink eight glasses?"},
        "options": [
            {"id": "A", "text": "Plants"},
            {"id": "B", "text": "Animals"},
            {"id": "C", "text": "Humans"},
            {"id": "D", "text": "No one"}
        ],
        "correct_answer": "C",
        "tags": ["reading", "paragraph"]
    },
    # Story
    {
        "id": "q-read-story-adult-adv",
        "learning_goal": "Reading Stories",
        "domain": "Reading",
        "skill": "reading",
        "difficulty": 4,
        "proficiency_level": "Advanced",
        "age_group": "18 – 25",
        "education_level": "College",
        "learner_type": "Student",
        "topic_category": "Literature",
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Read the story segment: 'The old man walked down the narrow street. It was raining heavily, but he forgot his umbrella. He sought shelter under the awning of a closed bakery.' Where did the man seek shelter?"},
        "options": [
            {"id": "A", "text": "A hospital"},
            {"id": "B", "text": "A closed bakery"},
            {"id": "C", "text": "His house"},
            {"id": "D", "text": "A bus stop"}
        ],
        "correct_answer": "B",
        "tags": ["reading", "story"]
    },
    
    # ── WRITING ──
    {
        "id": "q-write-letters-adult-beg",
        "learning_goal": "Basic Writing",
        "domain": "Writing",
        "skill": "writing",
        "difficulty": 1,
        "proficiency_level": "Beginner",
        "age_group": "60+",
        "education_level": "Never went to school",
        "learner_type": "Senior citizen",
        "topic_category": "Basics",
        "question_type": "mcq",
        "language": "en",
        "question_content": {"text": "Which letter comes after 'A'?"},
        "options": [
            {"id": "A", "text": "B"},
            {"id": "B", "text": "C"},
            {"id": "C", "text": "D"},
            {"id": "D", "text": "E"}
        ],
        "correct_answer": "A",
        "tags": ["letters", "writing"]
    },

    # ── IMAGE QUESTIONS ──
    # Beginner: Fruits, Animals, Colors, Numbers, Family, School Objects, Body Parts, Food (one of these)
    {
        "id": "q-img-fruit-child-beg",
        "learning_goal": "Vocabulary",
        "domain": "Vocabulary",
        "skill": "reading",
        "difficulty": 1,
        "proficiency_level": "Beginner",
        "age_group": "Under 12",
        "education_level": "Never went to school",
        "learner_type": "Student",
        "topic_category": "Fruits",
        "question_type": "image_mcq",
        "language": "en",
        "image_url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6caa6?w=400&q=80",
        "question_content": {"text": "What is this?"},
        "options": [
            {"id": "A", "text": "Apple"},
            {"id": "B", "text": "Banana"},
            {"id": "C", "text": "Orange"},
            {"id": "D", "text": "Grapes"}
        ],
        "correct_answer": "A",
        "tags": ["image", "fruits"]
    },
    # Elementary: Places, Shopping, Classroom, Transportation
    {
        "id": "q-img-shopping-adult-elm",
        "learning_goal": "Vocabulary",
        "domain": "Vocabulary",
        "skill": "reading",
        "difficulty": 2,
        "proficiency_level": "Elementary",
        "age_group": "26 – 45",
        "education_level": "Secondary school",
        "learner_type": "Homemaker",
        "topic_category": "Shopping",
        "question_type": "image_mcq",
        "language": "en",
        "image_url": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&q=80",
        "question_content": {"text": "Where is this person standing?"},
        "options": [
            {"id": "A", "text": "Supermarket"},
            {"id": "B", "text": "Library"},
            {"id": "C", "text": "Hospital"},
            {"id": "D", "text": "Bus Stop"}
        ],
        "correct_answer": "A",
        "tags": ["image", "shopping"]
    },
    # Intermediate: Daily activities, Conversations, Public signs, Maps
    {
        "id": "q-img-maps-adult-int",
        "learning_goal": "Comprehension",
        "domain": "Reading",
        "skill": "reading",
        "difficulty": 3,
        "proficiency_level": "Intermediate",
        "age_group": "18 – 25",
        "education_level": "College",
        "learner_type": "Student",
        "topic_category": "Maps",
        "question_type": "image_mcq",
        "language": "en",
        "image_url": "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=80",
        "question_content": {"text": "Looking at this map, what is next to the park?"},
        "options": [
            {"id": "A", "text": "School"},
            {"id": "B", "text": "Hospital"},
            {"id": "C", "text": "Library"},
            {"id": "D", "text": "Post Office"}
        ],
        "correct_answer": "C",
        "tags": ["image", "maps"]
    },
    # Advanced: Infographics, News images, Documents, Real-world scenarios
    {
        "id": "q-img-news-adult-adv",
        "learning_goal": "Comprehension",
        "domain": "Reading",
        "skill": "reading",
        "difficulty": 5,
        "proficiency_level": "Advanced",
        "age_group": "26 – 45",
        "education_level": "College",
        "learner_type": "Working professional",
        "topic_category": "News images",
        "question_type": "image_mcq",
        "language": "en",
        "image_url": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80",
        "question_content": {"text": "Looking at this newspaper headline image, what is the main topic?"},
        "options": [
            {"id": "A", "text": "Sports"},
            {"id": "B", "text": "Global Economy"},
            {"id": "C", "text": "Cooking"},
            {"id": "D", "text": "Weather"}
        ],
        "correct_answer": "B",
        "tags": ["image", "news"]
    }
]


async def seed_questions():
    """Seed the database with sample questions."""
    async with AsyncSessionLocal() as session:
        try:
            for q_data in SAMPLE_QUESTIONS:
                question = Question(
                    id=q_data["id"],
                    learning_goal=q_data["learning_goal"],
                    domain=q_data["domain"],
                    skill=q_data["skill"],
                    difficulty=q_data["difficulty"],
                    proficiency_level=q_data.get("proficiency_level"),
                    age_group=q_data.get("age_group"),
                    education_level=q_data.get("education_level"),
                    learner_type=q_data.get("learner_type"),
                    topic_category=q_data.get("topic_category"),
                    question_type=q_data["question_type"],
                    language=q_data["language"],
                    question_content=json.dumps(q_data["question_content"]),
                    options=json.dumps(q_data["options"]),
                    correct_answer=json.dumps(q_data["correct_answer"]),
                    is_active=True,
                    audio_script=q_data.get("audio_script"),
                    image_url=q_data.get("image_url"),
                    tags=json.dumps(q_data["tags"])
                )
                await session.merge(question)
                print(f"Upserted question: {q_data['id']}")

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
