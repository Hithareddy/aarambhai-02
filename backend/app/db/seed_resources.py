import asyncio
import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy.future import select
from app.db.session import async_session_factory, init_db
from app.models.resource import Resource

INITIAL_RESOURCES = [
    {
        "id": "res-1",
        "title": "Building a Daily Language Learning Habit",
        "type": "article",
        "category": "Study Guide",
        "duration": "5 min read",
        "description": "Proven psychological strategies to build consistency with just 10 minutes of daily micro-practice.",
        "content": """
# Building a Daily Language Learning Habit

Learning a language is built on consistency, not intensity. Studying for **10 minutes every day** yields far greater long-term recall than cramming for 2 hours once a week.

---

### Key Micro-Habit Strategies

1. **The 10-Minute Micro-Commitment**
   Set a goal so small that your brain feels zero resistance to starting. Commit to completing just **one lesson block** or **one Word of the Day**.

2. **Habit Stacking**
   Attach your language practice to an existing daily routine:
   - *Morning Tea/Coffee*: Review 5 vocabulary flashcards.
   - *Commute*: Listen to one audio pronunciation drill.
   - *Before Bed*: Spend 3 minutes chatting with your AI Tutor.

3. **Active Recall vs. Passive Reading**
   Don't just read words—speak them out loud, write them in short sentences, or test yourself with quick quizzes. Active generation strengthens neural connections exponentially faster.
""",
        "youtube_id": None,
        "video_channel": None,
        "download_url": None,
        "recommended_skill": "vocabulary",
        "target_language": "en",
        "age_groups": "all",
        "difficulty_level": "beginner",
    },
    {
        "id": "res-2",
        "title": "Everyday Greetings & Polite Expressions Cheat Sheet",
        "type": "cheat_sheet",
        "category": "Conversational Phrases",
        "duration": "Quick Reference",
        "description": "Essential greetings, polite responses, and practical icebreakers in English, Telugu, and Hindi.",
        "content": """
# Everyday Greetings Cheat Sheet

| English Phrase | Telugu (తెలుగు) | Hindi (हिंदी) | Context / Usage |
| :--- | :--- | :--- | :--- |
| **Good morning!** | నమస్కారం / శుభోదయం | नमस्ते / सुप्रभात | Morning greeting |
| **How are you?** | మీరు ఎలా ఉన్నారు? (Meeru ela unnaru?) | आप कैसे हैं? (Aap kaise hain?) | Courteous inquiry |
| **I am doing well, thank you.** | నేను బాగున్నాను, ధన్యవాదాలు | मैं ठीक हूँ, धन्यवाद | Polite response |
| **Nice to meet you.** | మిమ్మల్ని కలవడం సంతోషంగా ఉంది | आपसे मिलकर खुशी हुई | First-time introduction |
| **Could you help me?** | నాకు కొంచెం సహాయం చేస్తారా? | क्या आप मेरी मदद कर सकते हैं? | Requesting assistance |
| **Thank you very much!** | చాలా ధన్యవాదాలు! | बहुत-बहुत धन्यवाद! | Expressing gratitude |
| **See you tomorrow!** | రేపు కలుద్దాం! | कल मिलते हैं! | Friendly departure |
""",
        "youtube_id": None,
        "video_channel": None,
        "download_url": None,
        "recommended_skill": "speaking",
        "target_language": "en",
        "age_groups": "all",
        "difficulty_level": "beginner",
    },
    {
        "id": "res-3",
        "title": "Real-World Everyday English Conversation Practice",
        "type": "video",
        "category": "Video Lesson",
        "duration": "8 min video",
        "description": "Watch realistic workplace and social conversation scenarios with natural native pronunciation.",
        "content": "Guided video lesson demonstrating key spoken expressions in cafe, office, and travel settings.",
        "youtube_id": "d_0Af8Z8g6w",
        "video_channel": "BBC Learning English",
        "download_url": None,
        "recommended_skill": "listening",
        "target_language": "en",
        "age_groups": "student,pro,senior",
        "difficulty_level": "beginner",
    },
    {
        "id": "res-4",
        "title": "Sentence Building Practice Worksheet (Printable)",
        "type": "worksheet",
        "category": "Writing & Grammar",
        "duration": "Printable PDF",
        "description": "Structured fill-in-the-blank and sentence unscrambling exercises with answer keys.",
        "content": """
# Aarambh AI — Sentence Building Practice Worksheet

**Name:** _______________________   **Date:** _______________

---

### Section 1: Word Order (Reorder words to form correct sentences)

1. `( learning / am / English / I / daily )`
   👉 **Answer:** __________________________________________________

2. `( speaks / she / clearly / very )`
   👉 **Answer:** __________________________________________________

3. `( practice / perfect / daily / makes )`
   👉 **Answer:** __________________________________________________

---

### Section 2: Fill in the Blanks (Choose the correct verb)

1. He __________ (is / are) reading an interesting book.
2. They __________ (walk / walks) to school together every morning.
3. We __________ (has / have) completed today's lesson on Aarambh AI.

---

### Answer Key
*Section 1:* 1. I am learning English daily. 2. She speaks very clearly. 3. Daily practice makes perfect.
*Section 2:* 1. is  2. walk  3. have
""",
        "youtube_id": None,
        "video_channel": None,
        "download_url": "printable_section",
        "recommended_skill": "writing",
        "target_language": "en",
        "age_groups": "child,student",
        "difficulty_level": "beginner",
    },
    {
        "id": "res-5",
        "title": "Subject-Verb Agreement Rules Cheat Sheet",
        "type": "cheat_sheet",
        "category": "Grammar Rules",
        "duration": "Quick Reference",
        "description": "Master singular vs plural subject-verb pairings with clear, intuitive rules and examples.",
        "content": """
# Subject-Verb Agreement Rules

The fundamental rule of English grammar: **Singular subjects take singular verbs, and plural subjects take plural verbs.**

---

### 1. Basic Singular vs. Plural

- **Singular:** *He walks* to work. / *She speaks* English.
- **Plural:** *They walk* to work. / *We speak* English.

---

### 2. Pronoun Rules

- **He / She / It** $\rightarrow$ add **-s** or **-es** to the verb (*runs, eats, watches*).
- **I / You / We / They** $\rightarrow$ base verb without **-s** (*run, eat, watch*).

---

### 3. Special Indefinite Pronouns

Words like *everyone, somebody, each, anyone* are treated as **singular**:
- ✅ *Everyone **is** welcome.* (Not: *Everyone are welcome*)
- ✅ *Each learner **has** a unique path.*
""",
        "youtube_id": None,
        "video_channel": None,
        "download_url": None,
        "recommended_skill": "grammar",
        "target_language": "en",
        "age_groups": "all",
        "difficulty_level": "intermediate",
    },
    {
        "id": "res-6",
        "title": "English Pronunciation & Vocal Clarity Masterclass",
        "type": "video",
        "category": "Video Lesson",
        "duration": "10 min video",
        "description": "Learn mouth positioning and vocal stress to speak English with confidence and clarity.",
        "content": "Step-by-step audio-visual pronunciation guide covering vowel sounds and word stress.",
        "youtube_id": "2tU8Bq7H4-A",
        "video_channel": "BBC Learning English",
        "download_url": None,
        "recommended_skill": "speaking",
        "target_language": "en",
        "age_groups": "all",
        "difficulty_level": "beginner",
    },
]

async def seed_resources():
    await init_db()
    async with async_session_factory() as session:
        print("Seeding curated educational resources into database...")
        for r_data in INITIAL_RESOURCES:
            existing = await session.execute(
                select(Resource).where(Resource.id == r_data["id"])
            )
            if not existing.scalars().first():
                res = Resource(**r_data)
                session.add(res)
                print(f"  + Added Resource: '{r_data['title']}' ({r_data['type']})")
            else:
                print(f"  - Exists: '{r_data['title']}'")
        await session.commit()
        print("Resource seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_resources())

