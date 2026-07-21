import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.db.session import engine
from app.models.learning import LearningModule, Lesson, LessonProgress, ModuleProgress

# Fix Windows asyncio issues
if sys.platform == 'win32':
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def seed_curriculum():
    print("Starting Learning Curriculum Seed (Sprint 7)...")
    
    async with AsyncSession(engine) as session:
        print("Clearing out old curriculum traces...")
        await session.execute(delete(LessonProgress))
        await session.execute(delete(ModuleProgress))
        await session.execute(delete(Lesson))
        await session.execute(delete(LearningModule))

        # 1. Vocabulary Basics
        vocab_mod = LearningModule(
            id="core_vocabulary",
            title="Vocabulary Basics",
            description="Build your foundational English vocabulary with essential sight words.",
            skill="Vocabulary",
            difficulty=1,
            estimated_duration=15,
            order=1
        )
        session.add(vocab_mod)
        
        vocab_less_1 = Lesson(
            id="lesson_vocab_1",
            module_id="core_vocabulary",
            title="Interactive Learning Showcase",
            lesson_type="learning",
            schema_version="v1",
            order=1,
            content_blocks=[
                {"id": "b1-t", "type": "text", "content": {"heading": "Welcome to Interactive Lessons!", "body": "This lesson demonstrates all 10 block varieties inside the Aarambh AI engine."}},
                {"id": "b1-img", "type": "image", "content": {"url": "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800", "caption": "A dynamic learning environment.", "alt": "Learning"}},
                {"id": "b1-voc", "type": "vocabulary", "content": {"word": "Interactive", "pronunciation": "in-ter-AK-tiv", "definition": "Influencing or having an effect on each other.", "example": "The learning platform is highly interactive.", "audio": ""}},
                {"id": "b1-aud", "type": "audio", "content": {"title": "Listen to this phrase", "url": "https://webaudioapi.com/samples/audio-tag/chrono.mp3", "transcript": "Time flies when you are having fun."}},
                {"id": "b1-flsh", "type": "flashcard", "content": {"front": "What is the capital of India?", "back": "New Delhi"}},
                {"id": "b1-qz", "type": "quiz", "content": {"question": "Did you flip the flashcard?", "options": [{"id": "a", "text": "Yes, I did!"}, {"id": "b", "text": "No, I did not."}], "correctAnswer": "a", "explanation": "Awesome! Activity completed."}},
                {"id": "b1-conv", "type": "conversation", "content": {"dialogue": [{"speaker": "ai", "text": "Are you enjoying the new lesson?"}, {"speaker": "learner", "text": "Yes, it is very interactive!"}, {"speaker": "ai", "text": "Great to hear!"}]}},
                {"id": "b1-pron", "type": "pronunciation", "content": {"text": "I am learning English."}},
                {"id": "b1-sent", "type": "sentence_builder", "content": {"target_sentence": "This is a great lesson."}},
                {"id": "b1-rcp", "type": "recap", "content": {"title": "Showcase Completed", "points": ["You interacted with a vocabulary card.", "You took a practice quiz.", "You practiced speaking and dialogue."]}},
            ],
            completion_criteria={"type": "interactive"}
        )
        session.add(vocab_less_1)

        vocab_less_2 = Lesson(
            id="lesson_vocab_2",
            module_id="core_vocabulary",
            title="Common Adjectives",
            lesson_type="learning",
            schema_version="v1",
            order=2,
            content_blocks=[
                {"id": "vb2-t1", "type": "text", "content": {"heading": "Describing Things", "body": "Adjectives help you explain how something looks or feels."}},
                {"id": "vb2-v1", "type": "vocabulary", "content": {"word": "Happy", "pronunciation": "HAP-ee", "definition": "Feeling or showing pleasure."}},
                {"id": "vb2-v2", "type": "vocabulary", "content": {"word": "Big", "pronunciation": "Bihg", "definition": "Of considerable size."}},
            ],
            completion_criteria={"type": "standard_read"}
        )
        session.add(vocab_less_2)

        # 2. Grammar Foundations
        gram_mod = LearningModule(
            id="core_grammar",
            title="Simple Sentence Building",
            description="Learn how to structure standard English sentences.",
            skill="Grammar",
            difficulty=1,
            estimated_duration=20,
            order=2
        )
        session.add(gram_mod)

        gram_less_1 = Lesson(
            id="lesson_gram_1",
            module_id="core_grammar",
            title="Subject-Verb Object",
            lesson_type="learning",
            schema_version="v1",
            order=1,
            content_blocks=[
                {"id": "g1-t1", "type": "text", "content": {"heading": "The SVO Rule", "body": "In English, standard sentences typically consist of a Subject, followed by a Verb, and ending with an Object.\n\nFor example: 'I (Subject) hit (Verb) the ball (Object)'."}},
            ],
            completion_criteria={"type": "standard_read"}
        )
        session.add(gram_less_1)
        
        # 3. Speaking Foundations
        speak_mod = LearningModule(
            id="core_speaking",
            title="Pronunciation Basics",
            description="Master basic English phonetics and vowel sounds.",
            skill="Speaking",
            difficulty=1,
            estimated_duration=10,
            order=3
        )
        session.add(speak_mod)

        speak_less_1 = Lesson(
            id="lesson_speak_1",
            module_id="core_speaking",
            title="Long Vowels",
            lesson_type="practice",
            schema_version="v1",
            order=1,
            content_blocks=[
                {"id": "s1-t1", "type": "text", "content": {"heading": "Extended Vowel Shapes", "body": "Long vowels usually sound identical to their letter names..."}},
            ],
            completion_criteria={"type": "standard_read"}
        )
        session.add(speak_less_1)
        
        print("Committing curriculum seed to database...")
        await session.commit()

    print("Success! DB is successfully populated with Learning Module assets.")

if __name__ == "__main__":
    asyncio.run(seed_curriculum())
