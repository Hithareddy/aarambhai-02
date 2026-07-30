import asyncio
import json
import traceback
import uuid
import random

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings

# Q_DATA tuple format:
#   (id, domain, skill, difficulty, q_type,
#    en_prompt, en_opts, correct_answer,
#    te_prompt, te_opts,
#    audio_url, image_url)
#
# Note on arrange: en_opts is just the target sentence space-separated.
# Note on speaking: en_opts can be blank, correct_answer can be blank.

Q_DATA = [
    # === LISTENING ===
    # Difficulty 1
    ("q-list-1-1", "Listening", "listening", 1, "mcq",
     "Listen to the audio clip. Choose the correct picture.",
     "Apple,Banana,Cat,Dog", "A",
     "వినండి: సరైన బొమ్మను ఎంచుకోండి.",
     "ఆపిల్,అరటి,పిల్లి,కుక్క",
     "tts:Apple", None),
    ("q-list-1-2", "Listening", "listening", 1, "true_false",
     "Listen to the audio clip. True or False: This is a bird.",
     "True,False", "B",
     "వినండి: ఇది పక్షి, అవునా కాదా?",
     "అవును,కాదు",
     "tts:Dog", None),
    ("q-list-1-3", "Listening", "listening", 1, "fill_blank",
     "Listen to the audio word. Complete: 'O ___ E'",
     "N,M,P,R", "A",
     "వినండి: పూరించండి: 'O ___ E'",
     "N,M,P,R",
     "tts:One", None),

    # Difficulty 2
    ("q-list-2-1", "Listening", "listening", 2, "mcq",
     "Listen to the greeting. When do we say this?",
     "Night,Morning,Evening,Afternoon", "B",
     "వినండి: ఇది ఎప్పుడు చెప్తాం?",
     "రాత్రి,ఉదయం,సాయంత్రం,మధ్యాహ్నం",
     "tts:Good morning", None),
    ("q-list-2-2", "Listening", "listening", 2, "fill_blank",
     "Listen to the sentence. Complete: 'I ___ a boy'",
     "is,are,am,be", "C",
     "వినండి: పూరించండి: 'I ___ a boy'",
     "is,are,am,be",
     "tts:I am a boy", None),
    ("q-list-2-3", "Listening", "listening", 2, "match",
     "Listen to the sound. Match the sound to the correct animal.",
     "Dog,Cat,Cow,Bird", "B",
     "వినండి: జంతువు శబ్దంతో జతపరచండి.",
     "కుక్క,పిల్లి,ఆవు,పక్షి",
     "tts:Meow", None),

    # Difficulty 3
    ("q-list-3-1", "Listening", "listening", 3, "comprehension",
     "Listen to the audio dialogue. Who is the friend?",
     "Ravi,Sita,Dog,Apple", "A",
     "వినండి: స్నేహితుడు ఎవరు?",
     "రవి,సీత,కుక్క,ఆపిల్",
     "tts:Ravi is my friend", None),
    ("q-list-3-2", "Listening", "listening", 3, "arrange",
     "Listen to the sentence and arrange the words in order.",
     "I eat an apple", "ignored",
     "వినండి మరియు పదాలను గీతలో అమర్చండి.",
     "I eat an apple",
     "tts:I eat an apple", None),
    ("q-list-3-3", "Listening", "listening", 3, "mcq",
     "Listen to the statement. What color is mentioned?",
     "Red,Blue,Green,Black", "B",
     "వినండి: ఏ రంగు గురించి చెప్పారు?",
     "ఎరుపు,నీలం,ఆకుపచ్చ,నలుపు",
     "tts:The sky is blue", None),

    # Difficulty 4
    ("q-list-4-1", "Listening", "listening", 4, "comprehension",
     "Listen to the announcement. Where do they go on Monday?",
     "Home,Market,School,Park", "C",
     "వినండి: సోమవారం వాళ్ళు ఎక్కడికి వెళ్తున్నారు?",
     "ఇల్లు,సంతకి,బడికి,పార్క్",
     "tts:We go to school on Monday", None),
    ("q-list-4-2", "Listening", "listening", 4, "mcq",
     "Listen to the audio. What is the mother making?",
     "Food,Clothes,Books,Shoes", "A",
     "వినండి: ఆమె ఏం చేస్తోంది?",
     "భోజనం,బట్టలు,పుస్తకాలు,బూట్లు",
     "tts:My mother is cooking food", None),
    ("q-list-4-3", "Listening", "listening", 4, "arrange",
     "Listen to the sentence and arrange in order.",
     "She has a red ball", "ignored",
     "వినండి మరియు సరైన వాక్యం పేర్చండి.",
     "She has a red ball",
     "tts:She has a red ball", None),

    # Difficulty 5
    ("q-list-5-1", "Listening", "listening", 5, "comprehension",
     "Listen to the story. Which day is mentioned as a holiday?",
     "Monday,Friday,Sunday,Tuesday", "C",
     "వినండి: ఏ రోజు సెలవు అని చెప్పారు?",
     "సోమవారం,శుక్రవారం,ఆదివారం,మంగళవారం",
     "tts:Sunday is a holiday. I play with my brothers.", None),
    ("q-list-5-2", "Listening", "listening", 5, "mcq",
     "Listen to the sentence. Which fruit is mentioned?",
     "Apple,Mango,Banana,Orange", "C",
     "వినండి: ఏ పండు పేరు చెప్పారు?",
     "ఆపిల్,మామిడి,అరటిపండు,కమలా",
     "tts:My favourite fruit is banana. It is yellow.", None),
    ("q-list-5-3", "Listening", "listening", 5, "arrange",
     "Listen to the sentence and arrange the words.",
     "I drink milk in the morning", "ignored",
     "వినండి మరియు వాక్యం రాయండి.",
     "I drink milk in the morning",
     "tts:I drink milk in the morning", None),


    # === SPEAKING ===
    # Difficulty 1
    ("q-speak-1-1", "Speaking", "speaking", 1, "speaking",
     "Say your name.",
     "", "ignored",
     "మీ పేరు చెప్పండి.",
     "",
     None, None),
    ("q-speak-1-2", "Speaking", "speaking", 1, "speaking",
     "Say 'Apple'.",
     "", "ignored",
     "'Apple' అని చెప్పండి.",
     "",
     None, None),
    ("q-speak-1-3", "Speaking", "speaking", 1, "speaking",
     "Say the number 1.",
     "", "ignored",
     "1 నెంబర్ చెప్పండి.",
     "",
     None, None),

    # Difficulty 2
    ("q-speak-2-1", "Speaking", "speaking", 2, "speaking",
     "Say 'Good morning'.",
     "", "ignored",
     "'Good morning' అని చెప్పండి.",
     "",
     None, None),
    ("q-speak-2-2", "Speaking", "speaking", 2, "speaking",
     "Say 'Thank you'.",
     "", "ignored",
     "'Thank you' అని చెప్పండి.",
     "",
     None, None),
    ("q-speak-2-3", "Speaking", "speaking", 2, "speaking",
     "Name one fruit.",
     "", "ignored",
     "ఒక పండు పేరు చెప్పండి.",
     "",
     None, None),

    # Difficulty 3
    ("q-speak-3-1", "Speaking", "speaking", 3, "speaking",
     "Count from 1 to 5.",
     "", "ignored",
     "1 నుండి 5 వరకు లెక్కించండి.",
     "",
     None, None),
    ("q-speak-3-2", "Speaking", "speaking", 3, "speaking",
     "Say 'I am a boy' or 'I am a girl'.",
     "", "ignored",
     "'I am a boy' ఏదా 'I am a girl' అని చెప్పండి.",
     "",
     None, None),
    ("q-speak-3-3", "Speaking", "speaking", 3, "speaking",
     "Name three colours.",
     "", "ignored",
     "చామ్ మూడు రంగుల పేర్లు చెప్పండి.",
     "",
     None, None),

    # Difficulty 4
    ("q-speak-4-1", "Speaking", "speaking", 4, "speaking",
     "Say 'I am ten years old.'",
     "", "ignored",
     "'I am ten years old' అని చెప్పండి.",
     "",
     None, None),
    ("q-speak-4-2", "Speaking", "speaking", 4, "speaking",
     "Say 'My name is Ravi.'",
     "", "ignored",
     "'My name is Ravi' అని చెప్పండి.",
     "",
     None, None),
    ("q-speak-4-3", "Speaking", "speaking", 4, "speaking",
     "Name three animals.",
     "", "ignored",
     "మూడు జంతువుల పేర్లు చెప్పండి.",
     "",
     None, None),

    # Difficulty 5
    ("q-speak-5-1", "Speaking", "speaking", 5, "speaking",
     "What is your favourite fruit?",
     "", "ignored",
     "మీకు ఇష్టమైన పండు ఏది?",
     "",
     None, None),
    ("q-speak-5-2", "Speaking", "speaking", 5, "speaking",
     "Describe this picture in one sentence.",
     "", "ignored",
     "ఈ బొమ్మని గురించి ఒక చిన్న ఆంగ్ల వాక్యం చెప్పండి.",
     "",
     None, "/assets/images/school.svg"), # Uses local project-managed school SVG
    ("q-speak-5-3", "Speaking", "speaking", 5, "speaking",
     "What do you do in the morning?",
     "", "ignored",
     "ఉదయాన్నే మీరు ఏమి చేస్తారు?",
     "",
     None, None),


    # === READING ===
    # Difficulty 1
    ("q-read-1-1", "Reading", "reading", 1, "mcq",
     "Which letter is 'A'?",
     "A,B,C,D", "A",
     "'A' అనే అక్షరం ఏది?",
     "A,B,C,D",
     None, None),
    ("q-read-1-2", "Reading", "reading", 1, "image_mcq",
     "Look at the picture. Which animal is it?",
     "Dog,Cat,Cow,Bird", "A",
     "బొమ్మ చూడండి. ఇది ఏ జంతువు?",
     "కుక్క,పిల్లి,ఆవు,పక్షి",
     None, "/assets/images/dog.svg"),
    ("q-read-1-3", "Reading", "reading", 1, "true_false",
     "Read: '1, 2, 3'. Is 3 a number?",
     "True,False", "A",
     "చదవండి: '1, 2, 3'. 3 అనేది నెంబరా?",
     "అవును,కాదు",
     None, None),

    # Difficulty 2
    ("q-read-2-1", "Reading", "reading", 2, "fill_blank",
     "Read: 'B_Y'. Fill the missing letter for BOY.",
     "O,A,E,I", "A",
     "చదవండి: 'B_Y'. BOY కోసం పదాన్ని పూరించండి.",
     "O,A,E,I",
     None, None),
    ("q-read-2-2", "Reading", "reading", 2, "mcq",
     "Read: 'Red'. What colour is it?",
     "Red,Blue,Yellow,Green", "A",
     "చదవండి: 'Red'. అది ఏ రంగు?",
     "ఎరుపు,నీలం,పసుపు,ఆకుపచ్చ",
     None, None),
    ("q-read-2-3", "Reading", "reading", 2, "true_false",
     "Read: 'Hello'. This is a greeting.",
     "True,False", "A",
     "చదవండి: 'Hello'. ఇది పలకరింపు.",
     "అవును,కాదు",
     None, None),

    # Difficulty 3
    ("q-read-3-1", "Reading", "reading", 3, "comprehension",
     "Passage: 'This is a cat. The cat is small.' Is the cat big or small?",
     "Small,Big,Fat,Red", "A",
     "చదవండి: 'This is a cat. The cat is small.' పిల్లి పెద్దగా ఉందా, చిన్నగా ఉందా?",
     "చిన్నగా,పెద్దగా,లావుగా,ఎరుపు",
     None, None),
    ("q-read-3-2", "Reading", "reading", 3, "arrange",
     "Arrange to make a sentence.",
     "This is a cat", "ignored",
     "వాక్యంగా అమర్చండి.",
     "This is a cat",
     None, None),
    ("q-read-3-3", "Reading", "reading", 3, "fill_blank",
     "Complete: 'I have ___ nose.'",
     "one,two,three,four", "A",
     "పూరించండి: 'I have ___ nose.'",
     "one,two,three,four",
     None, None),

    # Difficulty 4
    ("q-read-4-1", "Reading", "reading", 4, "comprehension",
     "Passage: 'Ravi has a red ball. He plays in the park.' What colour is the ball?",
     "Blue,Red,Green,Yellow", "B",
     "చదవండి: 'Ravi has a red ball. He plays in the park.' బంతి రంగు ఏమిటి?",
     "నీలం,ఎరుపు,ఆకుపచ్చ,పసుపు",
     None, None),
    ("q-read-4-2", "Reading", "reading", 4, "mcq",
     "Read: 'Water is very important.' What is important?",
     "Water,Fire,Sky,Road", "A",
     "చదవండి: 'Water is very important.' ఏది ముఖ్యం?",
     "నీరు,మంట,ఆకాశం,రోడ్డు",
     None, None),
    ("q-read-4-3", "Reading", "reading", 4, "arrange",
     "Arrange into a sentence.",
     "I eat banana every day", "ignored",
     "వాక్యంగా మార్చండి.",
     "I eat banana every day",
     None, None),

    # Difficulty 5
    ("q-read-5-1", "Reading", "reading", 5, "comprehension",
     "Story: 'Sita wakes up at 7 o'clock. She drinks milk. She goes to school at 8 o'clock.' What time does Sita go to school?",
     "7,8,6,9", "B",
     "కథ: 'Sita wakes up at 7 o'clock. She drinks milk. She goes to school at 8 o'clock.' సీత ఎప్పుడు బడికి వెళ్తుంది?",
     "7,8,6,9",
     None, None),
    ("q-read-5-2", "Reading", "reading", 5, "fill_blank",
     "Fill in the blank: 'Sita likes to ___ milk.'",
     "drink,eat,play,run", "A",
     "ఖాళీని పూరించండి: 'Sita likes to ___ milk.'",
     "drink,eat,play,run",
     None, None),
    ("q-read-5-3", "Reading", "reading", 5, "arrange",
     "Arrange into a correct sentence.",
     "She goes to school to study", "ignored",
     "సరైన వాక్యంలో పేర్చండి.",
     "She goes to school to study",
     None, None),


    # === WRITING ===
    # Difficulty 1
    ("q-write-1-1", "Writing", "writing", 1, "mcq",
     "Which character is the letter B?",
     "B,3,D,V", "A",
     "B అక్షరం ఏది?",
     "B,3,D,V",
     None, None),
    ("q-write-1-2", "Writing", "writing", 1, "true_false",
     "'Apple' is spelled with A.",
     "True,False", "A",
     "'Apple' స్పెల్లింగ్ A తో మొదలవుతుంది.",
     "అవును,కాదు",
     None, None),
    ("q-write-1-3", "Writing", "writing", 1, "mcq",
     "Which one is a word?",
     "Dog,123,***,Xyqz", "A",
     "వీటిలో పదం ఏది?",
     "Dog,123,***,Xyqz",
     None, None),

    # Difficulty 2
    ("q-write-2-1", "Writing", "writing", 2, "mcq",
     "Write the plural form of 'Cat'.",
     "Cats,Cates,Catties,Caties", "A",
     "'Cat' కి బహువచనం (Plural) ఏది?",
     "Cats,Cates,Catties,Caties",
     None, None),
    ("q-write-2-2", "Writing", "writing", 2, "arrange",
     "Arrange to form a sentence.",
     "My name is Ravi", "ignored",
     "వాక్యాన్ని కరెక్ట్ గా అమర్చండి.",
     "My name is Ravi",
     None, None),
    ("q-write-2-3", "Writing", "writing", 2, "fill_blank",
     "Complete: 'I ___ a student.'",
     "is,are,am,be", "C",
     "పూర్తి చేయండి: 'I ___ a student.'",
     "is,are,am,be",
     None, None),

    # Difficulty 3
    ("q-write-3-1", "Writing", "writing", 3, "mcq",
     "Select the sentence with a full stop (period).",
     "Hello?,I am here.,Wow!,what", "B",
     "ఫుల్ స్టాప్ ఉన్న వాక్యాన్ని ఎంచుకోండి.",
     "Hello?,I am here.,Wow!,what",
     None, None),
    ("q-write-3-2", "Writing", "writing", 3, "arrange",
     "Arrange words.",
     "This is my family", "ignored",
     "పదాలను వాక్యంగా అమర్చండి.",
     "This is my family",
     None, None),
    ("q-write-3-3", "Writing", "writing", 3, "fill_blank",
     "Fill inside: 'The book is ___ the table.'",
     "on,in,under,to", "A",
     "ఖాళీని పూరించండి: 'The book is ___ the table.'",
     "on,in,under,to",
     None, None),

    # Difficulty 4
    ("q-write-4-1", "Writing", "writing", 4, "mcq",
     "Choose the correct spelling.",
     "Water,Woter,Watir,Watar", "A",
     "సరైన స్పెల్లింగ్ ఎంచుకోండి.",
     "Water,Woter,Watir,Watar",
     None, None),
    ("q-write-4-2", "Writing", "writing", 4, "fill_blank",
     "Fill missing: 'She ___ apples.'",
     "like,likes,liking,likely", "B",
     "ఖాళీని పూరించండి: 'She ___ apples.'",
     "like,likes,liking,likely",
     None, None),
    ("q-write-4-3", "Writing", "writing", 4, "arrange",
     "Arrange it correctly.",
     "He plays with his friends", "ignored",
     "వాక్యాన్ని అమర్చండి.",
     "He plays with his friends",
     None, None),

    # Difficulty 5
    ("q-write-5-1", "Writing", "writing", 5, "mcq",
     "What is the correct English word for నమస్కారం?",
     "Hello,Goodbye,Maybe,Sorry", "A",
     "నమస్కారం అనేదానికి కరెక్ట్ ఆంగ్ల పదం ఏది?",
     "Hello,Goodbye,Maybe,Sorry",
     None, None),
    ("q-write-5-2", "Writing", "writing", 5, "fill_blank",
     "Write the missing word: 'The sky is ___.'",
     "blue,red,green,purple", "A",
     "తప్పిపోయిన పదాన్ని రాయండి: 'The sky is ___.'",
     "blue,red,green,purple",
     None, None),
    ("q-write-5-3", "Writing", "writing", 5, "arrange",
     "Arrange the sentence correctly.",
     "Tomorrow is my birthday", "ignored",
     "సరిగ్గా అమర్చండి.",
     "Tomorrow is my birthday",
     None, None),
]


async def main():
    try:
        from app.db.session import engine
        async with engine.connect() as conn:
            # Clear old question seeds if they exist
            await conn.execute(text("DELETE FROM questions WHERE id LIKE 'q-%'"))
            await conn.execute(text("DELETE FROM content_translations WHERE entity_type = 'question' AND entity_id LIKE 'q-%'"))
            await conn.commit()
            print("Cleared existing q-% questions and translations.")

            seeded = 0
            for row in Q_DATA:
                (q_id, domain, skill, diff, q_type,
                 en_prompt, en_opts, correct,
                 te_prompt, te_opts,
                 audio_url, image_url) = row

                # Dynamic Duration specific to new Aarambh simplifications
                max_duration = 30
                if skill == "speaking":
                    if diff == 1: max_duration = 5
                    elif diff == 2: max_duration = 10
                    elif diff == 3 or diff == 4: max_duration = 15
                    else: max_duration = 20

                if q_type == "arrange":
                    # For arrange, we space split the target string directly.
                    words = [w.strip() for w in en_opts.split(" ") if w.strip()]
                    shuffled = list(words)
                    random.seed(42) # Deterministic shuffle for seeds
                    random.shuffle(shuffled)
                    
                    en_options_list = [{"id": f"w{i}", "text": w} for i, w in enumerate(shuffled)]
                    correct_to_store = words 
                    
                    if te_opts:
                        te_words = [w.strip() for w in te_opts.split(" ") if w.strip()]
                        te_shuffled = list(te_words)
                        random.shuffle(te_shuffled)
                        te_options_list = [{"id": f"w{i}", "text": w} for i, w in enumerate(te_shuffled)]
                        te_correct_to_store = te_words
                    else:
                        te_options_list = en_options_list
                        te_correct_to_store = correct_to_store
                elif q_type == "speaking":
                    # Speaking requires no multiple choice options, just dummy fallbacks
                    en_options_list = []
                    te_options_list = []
                    correct_to_store = []
                    te_correct_to_store = []
                else:
                    en_options_list = [{"id": chr(65 + i), "text": opt} for i, opt in enumerate(en_opts.split(","))]
                    te_options_list = [{"id": chr(65 + i), "text": opt} for i, opt in enumerate(te_opts.split(","))]
                    correct_to_store = correct
                    te_correct_to_store = correct

                # Insert logical English question with media fields
                await conn.execute(
                    text("""
                        INSERT INTO questions (
                            id, learning_goal, domain, skill, difficulty, proficiency_level, question_type,
                            language, question_content, options, correct_answer, is_active,
                            audio_url, image_url, max_duration_seconds
                        ) VALUES (
                            :id, :lg, :domain, :skill, :diff, :prof_level, :q_type,
                            'en', :q_content, :options, :correct, True,
                            :audio_url, :image_url, :max_dur
                        )
                    """),
                    {
                        "id": q_id,
                        "lg": f"Adaptive {domain}",
                        "domain": domain,
                        "skill": skill,
                        "diff": diff,
                        "q_type": q_type,
                        "max_dur": max_duration,
                        "prof_level": ["Beginner", "Elementary", "Intermediate", "Advanced", "Advanced"][min(4, diff - 1)],
                        "q_content": json.dumps({"text": en_prompt}),
                        "options": json.dumps(en_options_list),
                        "correct": json.dumps(correct_to_store),
                        "audio_url": audio_url,
                        "image_url": image_url,
                    }
                )

                # Insert Telugu translation
                translated_fields = {
                    "question_text": te_prompt,
                    "option_a": te_options_list[0]["text"] if len(te_options_list) > 0 else "",
                    "option_b": te_options_list[1]["text"] if len(te_options_list) > 1 else "",
                    "option_c": te_options_list[2]["text"] if len(te_options_list) > 2 else "",
                    "option_d": te_options_list[3]["text"] if len(te_options_list) > 3 else "",
                    "correct_answer": te_correct_to_store
                }
                await conn.execute(
                    text("""
                        INSERT INTO content_translations (
                            id, entity_type, entity_id, language_code, translated_fields
                        ) VALUES (
                            :id, 'question', :q_id, 'te', :fields
                        )
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "q_id": q_id,
                        "fields": json.dumps(translated_fields)
                    }
                )
                seeded += 1

            await conn.commit()
            print(f"Successfully seeded {seeded} Grade 1-5 level questions and translations.")
            diff_counts = {}
            skill_counts = {}
            for row in Q_DATA:
                d, s = row[3], row[2]
                diff_counts[d] = diff_counts.get(d, 0) + 1
                skill_counts[s] = skill_counts.get(s, 0) + 1
            print(f"By difficulty: {dict(sorted(diff_counts.items()))}")
            print(f"By skill:      {dict(sorted(skill_counts.items()))}")
        
        await engine.dispose()

    except Exception as e:
        traceback.print_exc()


if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
