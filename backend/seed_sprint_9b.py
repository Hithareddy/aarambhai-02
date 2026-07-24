import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from app.db.base import Base
from app.db.session import engine
from app.models.learning import LearningModule, Lesson, LessonProgress, ModuleProgress
from app.models.user import User
from app.models.learner import LearnerProfile
from app.models.assessment import AssessmentResult

# Fix Windows asyncio issues
if sys.platform == 'win32':
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

CURRICULUM_BLOCKS = {
    "vocab_basics": [
        {"id": "vb-1", "type": "text", "content": {"heading": "Welcome to Vocabulary Basics", "body": "Today we will learn how to greet people correctly."}},
        {"id": "vb-2", "type": "vocabulary", "content": {"word": "Hello", "pronunciation": "heh-LOW", "definition": "A standard greeting.", "example": "Hello, how are you today?", "audio": "https://raw.githubusercontent.com/mdn/webaudio-examples/main/audio-analyser/viper.mp3"}},
        {"id": "vb-3", "type": "vocabulary", "content": {"word": "Goodbye", "pronunciation": "gud-BYE", "definition": "Used when leaving.", "example": "Goodbye, see you tomorrow!", "audio": ""}},
        {"id": "vb-4", "type": "flashcard", "content": {"front": "What is a common friendly greeting?", "back": "Hello"}},
        {"id": "vb-5", "type": "quiz", "content": {"question": "Which of these words do you use when someone gives you a gift?", "options": [{"id": "a", "text": "Hello"}, {"id": "b", "text": "Thank you"}, {"id": "c", "text": "Goodbye"}], "correctAnswer": "b", "explanation": "You always say 'Thank you' to show gratitude."}},
        {"id": "vb-6", "type": "recap", "content": {"title": "Vocabulary Completed", "points": ["You learned standard greetings.", "You passed the gratitude quiz!"]}}
    ],
    "grammar_nouns": [
        {"id": "gn-1", "type": "text", "content": {"heading": "Introduction to Nouns", "body": "A noun is a word that names a **person**, **place**, or **thing**."}},
        {"id": "gn-2", "type": "image", "content": {"url": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800", "caption": "A School (Place), a Boy (Person), and a Book (Thing).", "alt": "Education"}},
        {"id": "gn-3", "type": "flashcard", "content": {"front": "Is 'Dog' a Person, Place, or Thing?", "back": "Thing (Animal)"}},
        {"id": "gn-4", "type": "sentence_builder", "content": {"target_sentence": "The dog runs fast."}},
        {"id": "gn-5", "type": "quiz", "content": {"question": "Which of the following is a noun?", "options": [{"id": "a", "text": "Apple"}, {"id": "b", "text": "Run"}, {"id": "c", "text": "Quickly"}], "correctAnswer": "a", "explanation": "Apple is a thing. Run is a verb. Quickly is an adverb."}},
        {"id": "gn-6", "type": "recap", "content": {"title": "Grammar Mastered", "points": ["Learned the definition of Nouns.", "Identified nouns in a quiz."]}}
    ],
    "read_sentences": [
        {"id": "rs-1", "type": "text", "content": {"heading": "Reading Simple Sentences", "body": "Reading requires focusing on standard sentence structures like Subject + Verb + Object."}},
        {"id": "rs-2", "type": "audio", "content": {"title": "Listen to the Pace", "url": "https://webaudioapi.com/samples/audio-tag/chrono.mp3", "transcript": "The quick brown fox jumps over the lazy dog."}},
        {"id": "rs-3", "type": "sentence_builder", "content": {"target_sentence": "She is reading a book."}},
        {"id": "rs-4", "type": "quiz", "content": {"question": "Did the voice in the audio mention a fox?", "options": [{"id": "a", "text": "Yes"}, {"id": "b", "text": "No"}], "correctAnswer": "a", "explanation": "Yes, 'The quick brown fox'."}},
        {"id": "rs-5", "type": "recap", "content": {"title": "Reading Clear", "points": ["Followed along with an audio transcript.", "Rebuilt a valid reading sentence."]}}
    ],
    "write_sentences": [
        {"id": "ws-1", "type": "text", "content": {"heading": "Sentence Building", "body": "Let's put words together to write full thoughts."}},
        {"id": "ws-2", "type": "sentence_builder", "content": {"target_sentence": "I go to school."}},
        {"id": "ws-3", "type": "sentence_builder", "content": {"target_sentence": "They play cricket."}},
        {"id": "ws-4", "type": "flashcard", "content": {"front": "What's missing? 'She ___ an apple.'", "back": "eats"}},
        {"id": "ws-5", "type": "recap", "content": {"title": "Writing Success", "points": ["Assembled basic SVO structures.", "Filled in missing verbs."]}}
    ],
    "listen_conversations": [
        {"id": "lc-1", "type": "text", "content": {"heading": "Everyday Conversations", "body": "Listening to dialogue helps you understand natural English rhythm."}},
        {"id": "lc-2", "type": "conversation", "content": {"dialogue": [{"speaker": "ai", "text": "Hello, how are you today?"}, {"speaker": "learner", "text": "I am fine, thank you. And you?"}, {"speaker": "ai", "text": "I am doing great, thanks for asking!"}]}},
        {"id": "lc-3", "type": "quiz", "content": {"question": "How did the learner respond?", "options": [{"id": "a", "text": "I am angry, thank you."}, {"id": "b", "text": "I am fine, thank you."}], "correctAnswer": "b", "explanation": "A polite standard response!"}},
        {"id": "lc-4", "type": "recap", "content": {"title": "Listening Mastered", "points": ["You interacted with an AI dialogue branch.", "You answered reading comprehension."]}}
    ],
    "speak_greetings": [
        {"id": "sg-1", "type": "text", "content": {"heading": "Greetings and Introductions", "body": "Speak confidently by practicing your pronunciation."}},
        {"id": "sg-2", "type": "pronunciation", "content": {"text": "My name is John."}},
        {"id": "sg-3", "type": "pronunciation", "content": {"text": "It is nice to meet you."}},
        {"id": "sg-4", "type": "conversation", "content": {"dialogue": [{"speaker": "ai", "text": "What is your name?"}, {"speaker": "learner", "text": "My name is John."}, {"speaker": "ai", "text": "Nice to meet you, John!"}]}},
        {"id": "sg-5", "type": "recap", "content": {"title": "Speaking Complete", "points": ["Practiced vocal greetings.", "Participated in a dynamic chat!"]}}
    ]
}

# The remaining 20 modules will get a generic but complete interactive payload if they aren't uniquely mapped.
GENERIC_BLOCKS = [
    {"id": "g-1", "type": "text", "content": {"heading": "Immersive Learning", "body": "Continue practicing your core fundamentals."}},
    {"id": "g-2", "type": "vocabulary", "content": {"word": "Practice", "pronunciation": "PRAK-tis", "definition": "Repeated action to improve skill.", "example": "Practice makes perfect.", "audio": ""}},
    {"id": "g-3", "type": "flashcard", "content": {"front": "Why do we learn?", "back": "To expand our knowledge!"}},
    {"id": "g-4", "type": "sentence_builder", "content": {"target_sentence": "I am learning every day."}},
    {"id": "g-5", "type": "quiz", "content": {"question": "Have you reviewed today's material?", "options": [{"id": "a", "text": "Yes"}, {"id": "b", "text": "No"}], "correctAnswer": "a", "explanation": "Keep up the momentum!"}},
    {"id": "g-6", "type": "recap", "content": {"title": "Module Completed", "points": ["You explored vocabulary.", "You rebuilt a sentence."]}}
]

async def seed_9b():
    print("Starting Deep Content Authoring (Sprint 9B)...")
    
    async with AsyncSession(engine) as session:
        # Instead of redefining modules natively, just update the JSON payloads of the Lessons in DB matching our new Interactive blocks.
        
        from sqlalchemy import select
        result = await session.execute(select(Lesson))
        lessons = result.scalars().all()
        
        counter = 0
        for lesson in lessons:
            mod_id = lesson.module_id
            payload = CURRICULUM_BLOCKS.get(mod_id, GENERIC_BLOCKS)
            
            # Reconstruct unique IDs based on the module tracking to ensure React keys do not overlap globally
            mapped_payload = []
            for i, block in enumerate(payload):
                new_block = block.copy()
                new_block['id'] = f"{mod_id}-b{i}"
                mapped_payload.append(new_block)
                
            lesson.content_blocks = mapped_payload
            lesson.completion_criteria = {"type": "interactive"}
            counter += 1
            
        print(f"Committing interactive content upgrades to {counter} lessons...")
        await session.commit()
        print("Success! High-Fidelity Lesson blocks deployed.")

        print("Executing Sprint 10.5 Quality Assurance Validation Sweep...")
        from app.services.validation_service import ValidationService
        validator = ValidationService(session)
        report = await validator.run_curriculum_audit()
        if not report["is_valid"]:
             print(f"WARNING: Validation Failed! Accessibility Flags: {len(report['accessibility_warnings'])}, Content Errors: {len(report['content_errors'])}")
        else:
             print("Validation Sweep PASSED: All module pipelines securely integrated.")

if __name__ == "__main__":
    asyncio.run(seed_9b())
