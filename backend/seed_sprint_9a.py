import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from app.db.base import Base
from app.db.session import engine
from app.models.learning import LearningModule, Lesson, LessonProgress, ModuleProgress
from app.models.user import User   # Needed for relationship/FK mapping
from app.models.learner import LearnerProfile # Needed for metadata
from app.models.assessment import AssessmentResult # Needed for metadata

# Fix Windows asyncio issues
if sys.platform == 'win32':
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

CURRICULUM = [
    {
        "skill": "Vocabulary",
        "modules": [
            ("vocab_basics", "Vocabulary Basics", "Essential sight words for beginners."),
            ("vocab_everyday", "Everyday Words", "Things around you."),
            ("vocab_family", "Family & Relationships", "Terms for family members."),
            ("vocab_food", "Food & Drinks", "Common items and ordering."),
            ("vocab_places", "Places & Directions", "Navigating the world.")
        ]
    },
    {
        "skill": "Grammar",
        "modules": [
            ("grammar_nouns", "Introduction to Nouns", "Learning naming words."),
            ("grammar_pronouns", "Understanding Pronouns", "Using he, she, it, they."),
            ("grammar_verbs", "Action Verbs", "Words that indicate an action."),
            ("grammar_tenses", "Basic Tenses", "Past, Present, and Future basics."),
            ("grammar_prepositions", "Articles & Prepositions", "A, An, The, and positional words.")
        ]
    },
    {
        "skill": "Reading",
        "modules": [
            ("read_sentences", "Reading Simple Sentences", "Practice reading structure."),
            ("read_paragraphs", "Reading Short Paragraphs", "Stringing sentences together."),
            ("read_stories", "Reading Stories", "Following a narrative.")
        ]
    },
    {
        "skill": "Writing",
        "modules": [
            ("write_sentences", "Sentence Building", "Creating your first sentence."),
            ("write_paragraphs", "Paragraph Writing", "Connecting ideas."),
            ("write_everyday", "Everyday Writing", "Notes, emails, and lists.")
        ]
    },
    {
        "skill": "Listening",
        "modules": [
            ("listen_conversations", "Everyday Conversations (Listening)", "Understanding daily talk."),
            ("listen_instructions", "Following Instructions", "Listening for directions."),
            ("listen_stories", "Story Listening", "Comprehending narrative audio.")
        ]
    },
    {
        "skill": "Speaking",
        "modules": [
            ("speak_greetings", "Greetings and Introductions", "Introducing yourself."),
            ("speak_intro", "Self Introduction", "Speaking about your life."),
            ("speak_daily", "Daily Conversations", "Speaking in everyday situations."),
            ("speak_pronunciation", "Pronunciation Practice", "Polishing your accents.")
        ]
    },
]

async def seed_9a():
    print("Starting Learning Curriculum Seed (Sprint 9A)...")
    
    async with engine.begin() as conn:
        print("Ensuring learning schema tables are created...")
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(engine) as session:
        print("Clearing out old curriculum traces...")
        try:
            await session.execute(delete(LessonProgress))
            await session.execute(delete(ModuleProgress))
            await session.execute(delete(Lesson))
            await session.execute(delete(LearningModule))
        except Exception as e:
            print(f"Skipping table drop: {e}")
            await session.rollback()

        for category in CURRICULUM:
            skill_name = category["skill"]
            prev_module = None
            
            for i, (mod_id, title, desc) in enumerate(category["modules"]):
                difficulty = (i // 2) + 1  # 1, 1, 2, 2, 3
                
                module = LearningModule(
                    id=mod_id,
                    title=title,
                    description=desc,
                    skill=skill_name,
                    difficulty=difficulty,
                    estimated_duration=15 + (i * 5),
                    order=i + 1,
                    prerequisites=[prev_module] if prev_module else []
                )
                session.add(module)
                
                # Add a skeletal lesson to ensure structural integrity (To be overwritten in 9B)
                lesson = Lesson(
                    id=f"{mod_id}_lesson_1",
                    module_id=mod_id,
                    title=f"{title} - Lesson 1",
                    lesson_type="learning",
                    schema_version="v1",
                    order=1,
                    content_blocks=[
                        {"id": f"b1-{mod_id}", "type": "text", "content": {"heading": f"Welcome to {title}", "body": "Placeholder content for 9A structure."}}
                    ],
                    completion_criteria={"type": "standard_read"}
                )
                session.add(lesson)
                
                prev_module = mod_id

        print("Committing 9A skeleton structure to database...")
        await session.commit()

    print("Success! DB is populated with 9A Curriculum Structure.")

if __name__ == "__main__":
    asyncio.run(seed_9a())
