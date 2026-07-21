import asyncio
import json
import traceback
import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings

# Q_DATA tuple format:
#   (id, domain, skill, difficulty, q_type,
#    en_prompt, en_opts (comma-sep), correct_answer,
#    te_prompt, te_opts (comma-sep),
#    audio_url, image_url)
#
# audio_url convention:
#   "tts:<phrase>" → browser Web Speech API speaks <phrase>
#   "https://..."  → <audio> element plays the file
#   None           → no audio
#
# image_url convention:
#   "https://..."  → <img> displays the file
#   None           → no image

Q_DATA = [
    # === LISTENING (12 existing + 3 difficulty-5) ===
    # Difficulty 1
    ("q-list-1-1", "Listening", "listening", 1, "mcq",
     "Listen to: 'Good morning'. Choose the correct greeting.",
     "Hello,Goodbye,Maybe,Never", "A",
     "వినండి: 'Good morning'. సరైన పలకరింపు ఎంచుకోండి.",
     "హలో (Hello),గుడ్ బై (Goodbye),బహుశా (Maybe),ఎన్నటికీ కాదు (Never)",
     "tts:Good morning", None),

    ("q-list-1-2", "Listening", "listening", 1, "true_false",
     "Dialogue: 'Good night'. True or False: This phrase is said in the morning.",
     "True,False", "B",
     "వ్యాఖ్యానం: 'Good night'. నిజమా అబద్ధమా: ఇది ఉదయం పూట చెప్తారు.",
     "నిజం (True),అబద్ధం (False)",
     "tts:Good night", None),

    ("q-list-1-3", "Listening", "listening", 1, "fill_blank",
     "Audio: 'My name is Ram'. Complete: 'My name ___ Ram'",
     "is,are,am,be", "A",
     "వినండి: 'My name is Ram'. పూరించండి: 'My name ___ Ram'",
     "is,are,am,be",
     "tts:My name is Ram", None),

    # Difficulty 2
    ("q-list-2-1", "Listening", "listening", 2, "mcq",
     "Audio: 'Where is the train station?'. What is the speaker asking for?",
     "Food,Directions,Time,Price", "B",
     "వినండి: 'Where is the train station?'. వక్త దేని గురించి అడుగుతున్నారు?",
     "ఆహారం (Food),దిశలు (Directions),సమయం (Time),ధర (Price)",
     "tts:Where is the train station?", None),

    ("q-list-2-2", "Listening", "listening", 2, "fill_blank",
     "Audio: 'She goes to school'. Complete: 'She ___ to school by bus'",
     "go,goes,going,went", "B",
     "వినండి: 'She goes to school'. పూరించండి: 'She ___ to school by bus'",
     "go,goes,going,went",
     "tts:She goes to school", None),

    ("q-list-2-3", "Listening", "listening", 2, "match",
     "Audio: 'Meow'. Match the sound to the correct animal.",
     "Dog,Cat,Cow,Bird", "B",
     "వినండి: 'Meow'. జంతువు శబ్దంతో జతపరచండి.",
     "కుక్క (Dog),పిల్లి (Cat),ఆవు (Cow),పక్షి (Bird)",
     "tts:Meow", None),

    # Difficulty 3
    ("q-list-3-1", "Listening", "listening", 3, "comprehension",
     "Dialogue: 'I need to see Dr. Kumar on Monday at 10 AM.' When is the appointment?",
     "Monday,Tuesday,Wednesday,Friday", "A",
     "వ్యాఖ్యానం: 'నేను సోమవారం ఉదయం 10 గంటలకు డాక్టర్ కుమార్ ని కలవాలి.' అపాయింట్‌మెంట్ ఎప్పుడు?",
     "సోమవారం (Monday),మంగళవారం (Tuesday),బుధవారం (Wednesday),శుక్రవారం (Friday)",
     "tts:I need to see Dr. Kumar on Monday at 10 AM", None),

    ("q-list-3-2", "Listening", "listening", 3, "arrange",
     "Audio: 'I eat an apple every day'. Arrange the words in the correct order.",
     "apple/every/day/I/eat,I/eat/an/apple/every/day,every/day/apple/eat/I,I/apple/eat/every/day", "B",
     "వినండి: 'I eat an apple every day'. పదాలను సరైన క్రమంలో అమర్చండి.",
     "apple/every/day/I/eat,I/eat/an/apple/every/day,every/day/apple/eat/I,I/apple/eat/every/day",
     "tts:I eat an apple every day", None),

    ("q-list-3-3", "Listening", "listening", 3, "mcq",
     "Audio: 'Fill out this form to open a bank account.' What action is described?",
     "Shopping,Banking,Traveling,Dining", "B",
     "వినండి: 'బ్యాంక్ ఖాతా తెరవడానికి ఈ ఫారాన్ని నింపండి.' ఈ పని దేనికి సంబంధించినది?",
     "షాపింగ్ (Shopping),బ్యాంకింగ్ (Banking),ప్రయాణం (Traveling),భోజనం (Dining)",
     "tts:Fill out this form to open a bank account", None),

    # Difficulty 4
    ("q-list-4-1", "Listening", "listening", 4, "comprehension",
     "Audio: 'Keep your ATM PIN confidential.' What does the PIN protect the account from?",
     "Family,Public,Unauthorized access,Loss", "C",
     "వినండి: 'మీ ఏటీఎమ్ పిన్‌‌ను రహస్యంగా ఉంచండి.' పిన్ దేని నుండి ఖాతాను కాపాడుతుంది?",
     "కుటుంబం (Family),ప్రజలు (Public),అనధికారిక యాక్సెస్ (Unauthorized access),నష్టం (Loss)",
     "tts:Keep your ATM PIN confidential", None),

    ("q-list-4-2", "Listening", "listening", 4, "mcq",
     "Audio: 'Board bus 45 at platform 3.' Where should the speaker board?",
     "Bus 40/Platform 5,Bus 45/Platform 3,Bus 35/Platform 4,Bus 45/Platform 2", "B",
     "వినండి: 'ప్లాట్‌ఫారమ్ 3 లో బస్సు 45 ఎక్కండి.' వక్త ఎక్కడ ఎక్కాలి?",
     "బస్సు 40/ప్లాట్‌ఫారమ్ 5,బస్సు 45/ప్లాట్‌ఫారమ్ 3,బస్సు 35/ప్లాట్‌ఫారమ్ 4,బస్సు 45/ప్లాట్‌ఫారమ్ 2",
     "tts:Board bus 45 at platform 3", None),

    ("q-list-4-3", "Listening", "listening", 4, "mcq",
     "Audio: 'Trains are delayed due to heavy rain.' What is the reason for the delay?",
     "Construction,Technical issue,Heavy rain,Festival", "C",
     "వినండి: 'భారీ వర్షాల వల్ల రైళ్లు ఆలస్యమవుతున్నాయి.' ఆలస్యానికి కారణం ఏమిటి?",
     "నిర్మాణం (Construction),సాంకేతిక సమస్య (Technical issue),భారీ వర్షం (Heavy rain),పండుగ (Festival)",
     "tts:Trains are delayed due to heavy rain", None),

    # Difficulty 5 — Listening
    ("q-list-5-1", "Listening", "listening", 5, "comprehension",
     "Dialogue: 'The conference has been rescheduled to next Thursday at 2 PM in Hall B. Please update your calendars.' What changed?",
     "Venue changed,Time and day changed,Speaker changed,Conference cancelled", "B",
     "సంభాషణ: 'సమావేశాన్ని వచ్చే గురువారం మధ్యాహ్నం 2 గంటలకు హాల్ B లో నిర్వహిస్తారు.' ఏమి మారింది?",
     "ప్రదేశం మారింది,సమయం మరియు రోజు మారింది,వక్త మారారు,సమావేశం రద్దయింది",
     "tts:The conference has been rescheduled to next Thursday at 2 PM in Hall B. Please update your calendars.", None),

    ("q-list-5-2", "Listening", "listening", 5, "mcq",
     "Audio: 'Despite the turbulence, the pilot managed to land safely.' What does turbulence refer to here?",
     "Storm in the terminal,Rough air conditions during flight,Engine failure,Runway congestion", "B",
     "వినండి: 'అల్లకల్లోలం ఉన్నప్పటికీ పైలట్ సురక్షితంగా దిగారు.' ఇక్కడ turbulence అంటే?",
     "టర్మినల్‌లో తుఫాను,విమానంలో ఎగురుతున్నపుడు గాలి అల్లకల్లోలం,ఇంజన్ వైఫల్యం,రన్‌వే రద్దీ",
     "tts:Despite the turbulence, the pilot managed to land safely.", None),

    ("q-list-5-3", "Listening", "listening", 5, "fill_blank",
     "Audio: 'The committee will reconvene after the recess.' Complete: 'The committee will ___ after the recess.'",
     "reconvene,reschedule,restructure,reconsider", "A",
     "వినండి: 'కమిటీ విరామం తర్వాత తిరిగి సమావేశమవుతుంది.' పూరించండి.",
     "reconvene,reschedule,restructure,reconsider",
     "tts:The committee will reconvene after the recess.", None),

    # === SPEAKING (12 existing + 3 difficulty-5) ===
    # Difficulty 1
    ("q-speak-1-1", "Speaking", "speaking", 1, "mcq",
     "How do you welcome a guest at home?",
     "Welcome,Goodbye,Please,Thank you", "A",
     "ఇంటికి వచ్చిన అతిథిని ఎలా ఆహ్వానిస్తారు?",
     "సాదర స్వాగతం (Welcome),వెళ్లొస్తాం (Goodbye),దయచేసి (Please),ధన్యవాదాలు (Thank you)",
     None, None),

    ("q-speak-1-2", "Speaking", "speaking", 1, "true_false",
     "Formal intro: 'Hello, my name is John.' Is it proper?",
     "True,False", "A",
     "పరిచయం: 'హలో, నా పేరు జాన్.' ఇది పద్ధతిగా ఉందా?",
     "నిజం (True),అబద్ధం (False)",
     None, None),

    ("q-speak-1-3", "Speaking", "speaking", 1, "mcq",
     "Which greeting is correct for the morning?",
     "Good morning,Good evening,Good night,Goodbye", "A",
     "ఉదయం పూట చెప్పే పలకరింపు ఏది?",
     "శుభోదయం (Good morning),శుభ సాయంత్రం (Good evening),శుభ రాత్రి (Good night),వెళ్లొస్తాం (Goodbye)",
     None, None),

    # Difficulty 2
    ("q-speak-2-1", "Speaking", "speaking", 2, "mcq",
     "Correct pronunciation of 'receive': where is the emphasis?",
     "re-CEIVE,RE-ceive,re-ce-ive,receive", "A",
     "'receive' అనే పదాన్ని పలికేటప్పుడు ఏ భాగాన్ని నొక్కి పలకాలి?",
     "re-CEIVE,RE-ceive,re-ce-ive,receive",
     None, None),

    ("q-speak-2-2", "Speaking", "speaking", 2, "fill_blank",
     "Dialogue: 'Nice to ___ you.'",
     "meet,meat,met,meeting", "A",
     "సంభాషణ: 'Nice to ___ you.' ఖాళీని పూరించండి.",
     "meet,meat,met,meeting",
     None, None),

    ("q-speak-2-3", "Speaking", "speaking", 2, "mcq",
     "How do you ask for water politely?",
     "Give water,Can I have some water?,I want water,Water now", "B",
     "మంచినీరు కావాలని మర్యాదగా ఎలా అడుగుతారు?",
     "నీళ్లు ఇవ్వు,కొద్దిగా నీరు ఇవ్వగలరా?,నాకు నీళ్లు కావాలి,ఇప్పుడే నీళ్లు",
     None, None),

    # Difficulty 3
    ("q-speak-3-1", "Speaking", "speaking", 3, "mcq",
     "In public speaking, what is the main rule for tempo?",
     "Speak super fast,Speak clearly with pauses,Scream loud,Mumble quietly", "B",
     "సభలో మాట్లాడేటప్పుడు ప్రధాన నియమం ఏది?",
     "చాలా వేగంగా మాట్లాడాలి,విరామాలతో స్పష్టంగా మాట్లాడాలి,గట్టిగా అరవాలి,నమలాలి",
     None, None),

    ("q-speak-3-2", "Speaking", "speaking", 3, "arrange",
     "Arrange into a polite question: 'help / how / I / can / you'",
     "how help I can you,how I can help you,how can I help you,I can help you how", "C",
     "మర్యాదగా అడిగే విధంగా అమర్చండి: 'help / how / I / can / you'",
     "how help I can you,how I can help you,how can I help you,I can help you how",
     None, None),

    ("q-speak-3-3", "Speaking", "speaking", 3, "mcq",
     "What is the formal way to politely disagree?",
     "You are wrong,I see your point but I disagree,Shut up,No way", "B",
     "అభిప్రాయభేదాన్ని మర్యాదగా వ్యక్తపరిచే విధానం ఏది?",
     "మీరు తప్పు చెప్తున్నారు,మీ పాయింట్ నాకు అర్థమైంది కానీ నా అభిప్రాయం వేరు,నోరు మూసుకోండి,అస్సలు ఒప్పుకోను",
     None, None),

    # Difficulty 4
    ("q-speak-4-1", "Speaking", "speaking", 4, "mcq",
     "During an interview, how do you describe your experience?",
     "I worked for 3 years,None of your business,I hate jobs,I am rich", "A",
     "ఇంటర్వ్యూలో మీ అనుభవాన్ని ఎలా వ్యక్తపరుస్తారు?",
     "నేను 3 సంవత్సరాలు పనిచేశాను,మీకు అనవసరం,నాకు ఉద్యోగాలు నచ్చవు,నేను ధనవంతుడిని",
     None, None),

    ("q-speak-4-2", "Speaking", "speaking", 4, "mcq",
     "What is the proper response when accepting a job offer?",
     "I accept with gratitude,Whatever,Give me money now,Okay I guess", "A",
     "ఉద్యోగ ప్రతిపాదనకు సరైన స్పందన ఏది?",
     "నేను కృతజ్ఞతలతో అంగీకరిస్తున్నాను,ఏదో ఒకటిలే,ఇప్పుడే డబ్బులు ఇవ్వు,సరే చూద్దాం",
     None, None),

    ("q-speak-4-3", "Speaking", "speaking", 4, "mcq",
     "Presenting a report: 'Let me summarize the key findings.' What does this mean?",
     "I will read everything,I will list the main points,I am starting now,I am leaving", "B",
     "'కీలక ఫలితాలను సంగ్రహంగా వివరిస్తాను' అంటే అర్థం ఏమిటి?",
     "నేను అంతా చదువుతాను,ప్రధానాంశాలను మాత్రమే పేర్కొంటాను,నేను ప్రారంభిస్తున్నాను,నేను వెళ్తున్నాను",
     None, None),

    # Difficulty 5 — Speaking
    ("q-speak-5-1", "Speaking", "speaking", 5, "mcq",
     "In a formal negotiation, your counterpart says: 'We cannot budge on the delivery timeline.' Which response de-escalates while keeping your position?",
     "Fine, forget the deal,I understand your constraints. Could we explore phased delivery as a middle ground?,That is unacceptable,You are being unreasonable", "B",
     "ఒక అధికారిక చర్చలో 'మేము డెలివరీ గడువు మార్చలేం' అని చెప్పారు. మీ స్థితి కాపాడుకుంటూ ఉద్రిక్తతను తగ్గించే సమాధానం ఏది?",
     "సరే, వదిలేయండి,మీ పరిమితులు అర్థమయ్యాయి. దశల వారీ డెలివరీ పరిశీలిద్దామా?,అది అంగీకారయోగ్యం కాదు,మీరు అసమంజసంగా ఉన్నారు",
     None, None),

    ("q-speak-5-2", "Speaking", "speaking", 5, "arrange",
     "Arrange into a formal apology: 'sincerely / I / apologize / inconvenience / for / the'",
     "I apologize for the sincerely inconvenience,I sincerely apologize for the inconvenience,sincerely I for the apologize inconvenience,for the inconvenience I sincerely apologize", "B",
     "అధికారిక క్షమాపణను సరైన క్రమంలో అమర్చండి.",
     "I apologize for the sincerely inconvenience,I sincerely apologize for the inconvenience,sincerely I for the apologize inconvenience,for the inconvenience I sincerely apologize",
     None, None),

    ("q-speak-5-3", "Speaking", "speaking", 5, "fill_blank",
     "Complete the formal recommendation: 'I would like to ___ Mr. Ravi for the senior engineer position.'",
     "nominate,command,perform,indicate", "A",
     "అధికారిక సిఫారసు పూరించండి: 'I would like to ___ Mr. Ravi for the senior engineer position.'",
     "nominate,command,perform,indicate",
     None, None),

    # === READING (12 existing + 3 difficulty-5) ===
    # Difficulty 1
    ("q-read-1-1", "Reading", "reading", 1, "mcq",
     "Identify the first letter of the word 'Apple'.",
     "A,B,P,L", "A",
     "'Apple' అనే పదం ఏ అక్షరంతో మొదలవుతుంది?",
     "A,B,P,L",
     None, None),

    ("q-read-1-2", "Reading", "reading", 1, "true_false",
     "Read: 'Cat'. Does 'Cat' have three letters?",
     "True,False", "A",
     "చదవండి: 'Cat'. 'Cat' లో మూడు అక్షరాలు ఉన్నాయా?",
     "నిజం,అబద్ధం",
     None, None),

    ("q-read-1-3", "Reading", "reading", 1, "fill_blank",
     "Read and complete the sequence: 'A, B, C, ___'",
     "D,E,F,G", "A",
     "చదవండి మరియు పూరించండి: 'A, B, C, ___'",
     "D,E,F,G",
     None, None),

    # Difficulty 2
    ("q-read-2-1", "Reading", "reading", 2, "mcq",
     "Read: 'Open from 9 AM to 5 PM.' How long is it open?",
     "5 hours,8 hours,12 hours,24 hours", "B",
     "చదవండి: 'ఉదయం 9 నుండి సాయంత్రం 5 వరకు తెరిచి ఉంటుంది.' ఎన్ని గంటలు తెరిచి ఉంటుంది?",
     "5 గంటలు,8 గంటలు,12 గంటలు,24 గంటలు",
     None, None),

    ("q-read-2-2", "Reading", "reading", 2, "image_mcq",
     "Which sign means 'No Parking'?",
     "P with red slash,P with green circle,Toll sign,Stop sign", "A",
     "వీటిలో 'నో పార్కింగ్' సూచించేది ఏది?",
     "ఎరుపు గీత ఉన్న P గుర్తు,ఆకుపచ్చ సర్కిల్ ఉన్న P గుర్తు,టోల్ చిహ్నం,స్టాప్ గుర్తు",
     None, "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/No_Parking_Sign.svg/200px-No_Parking_Sign.svg.png"),

    ("q-read-2-3", "Reading", "reading", 2, "mcq",
     "Read: 'Keep medicine out of reach of children.' Why?",
     "Children will sell it,Safe storage,It is dangerous for children,It is expensive", "C",
     "చదవండి: 'మందులను పిల్లలకు దూరంగా ఉంచండి.' ఎందుకు?",
     "పిల్లలు అమ్మేస్తారు,సురక్షిత నిల్వ కోసం,పిల్లల ఆరోగ్యానికి ప్రమాదకరం,ఇది ఖరీదైనది",
     None, None),

    # Difficulty 3
    ("q-read-3-1", "Reading", "reading", 3, "comprehension",
     "Story: 'Latha went to market. She bought mangoes, bananas, and a bag. Then she went home.' What fruit did she buy?",
     "Apples,Mangoes,Grapes,Oranges", "B",
     "కథ: 'లత మార్కెట్‌కు వెళ్లింది. మామిడిపండ్లు, అరటిపండ్లు తెచ్చుకుంది. ఆపై ఇంటికి వెళ్లింది.' ఆమె ఏ పండు కొన్నది?",
     "ఆపిల్స్,మామిడిపండ్లు,ద్రాక్ష,నారింజ",
     None, None),

    ("q-read-3-2", "Reading", "reading", 3, "arrange",
     "Arrange the sign words in the correct order: 'BAGGAGE / CLAIM / AREA'",
     "AREA CLAIM BAGGAGE,BAGGAGE CLAIM AREA,CLAIM AREA BAGGAGE,CLAIM BAGGAGE AREA", "B",
     "బోర్డు పదాలను అమర్చండి: 'BAGGAGE / CLAIM / AREA'",
     "AREA CLAIM BAGGAGE,BAGGAGE CLAIM AREA,CLAIM AREA BAGGAGE,CLAIM BAGGAGE AREA",
     None, None),

    ("q-read-3-3", "Reading", "reading", 3, "fill_blank",
     "Complete the sign: 'Wet Floor: Proceed with ___'",
     "Speed,Caution,Anger,Laughter", "B",
     "'తడి నేల: ___ తో నడవండి' బోర్డు నియమం?",
     "వేగం,జాగ్రత్త (Caution),కోపం,నవ్వు",
     None, None),

    # Difficulty 4
    ("q-read-4-1", "Reading", "reading", 4, "comprehension",
     "Article: 'Solar energy is clean and renewable. It uses sun's rays to generate electricity, reducing carbon footprint.' What generates solar energy?",
     "Coal,Sun rays,Wind,Water", "B",
     "వ్యాసం: 'సౌర శక్తి స్వచ్ఛమైనది. విద్యుత్తును ఉత్పత్తి చేయడానికి సూర్యకిరణాలను వాడుతుంది.' ఈ శక్తికి మూలం ఏది?",
     "బొగ్గు,సూర్యకిరణాలు (Sun rays),గాలి,నీరు",
     None, None),

    ("q-read-4-2", "Reading", "reading", 4, "mcq",
     "Manual instruction: 'Disconnect power before servicing the device.' What is the first step?",
     "Open device,Disconnect power,Clean device,Call expert", "B",
     "సూచన: 'పరికరం రిపేర్ చేయడానికి ముందు విద్యుత్ సరఫరా నిలిపివేయండి.' మొదటి దశ ఏది?",
     "పరికరం తెరవడం,విద్యుత్ సరఫరా నిలిపివేయడం,పరికరం శుభ్రం చేయడం,నిపుణుడిని పిలవడం",
     None, None),

    ("q-read-4-3", "Reading", "reading", 4, "mcq",
     "Paragraph: 'Organic farming avoids chemical pesticides, which protects soil health and ecosystems.' What is the benefit?",
     "Soil health,Pesticide sales,Chemical speed,Machine usage", "A",
     "వ్యాసం: 'సేంద్రీయ వ్యవసాయం రసాయన పురుగుమందులను నివారిస్తూ నేల ఆరోగ్యాన్ని కాపాడుతుంది.' దీని వల్ల ప్రయోజనమెంటి?",
     "నేల ఆరోగ్యం (Soil health),పురుగుమందుల అమ్మకాలు,రసాయన వేగం,యంత్రాల వినియోగం",
     None, None),

    # Difficulty 5 — Reading
    ("q-read-5-1", "Reading", "reading", 5, "comprehension",
     "Article: 'Neuroplasticity refers to the brain's ability to reorganize itself by forming new neural connections. This process is most active in childhood but continues throughout life, making deliberate practice a powerful tool for adult learning.' According to the article, why is deliberate practice important for adults?",
     "It reverses aging,It leverages the brain's continued ability to form new connections,It replaces childhood learning,Neuroplasticity stops at adulthood", "B",
     "వ్యాసం: 'న్యూరోప్లాస్టిసిటీ' అనగా మెదడు కొత్త నరవ్యవస్థ అనుసంధానాలు ఏర్పరచుకోగలిగే సామర్థ్యం. పెద్దలలో ఇది ఎందుకు ముఖ్యం?",
     "వృద్ధాప్యాన్ని తిప్పికొట్టడం,మెదడు కొత్త అనుసంధానాలు ఏర్పరచుకోగల సామర్థ్యాన్ని ఉపయోగించడం,బాల్య అభ్యాసాన్ని భర్తీ చేయడం,న్యూరోప్లాస్టిసిటీ పెద్దవయసులో ఆగిపోతుంది",
     None, None),

    ("q-read-5-2", "Reading", "reading", 5, "mcq",
     "Legal clause: 'The licensor grants the licensee a non-exclusive, non-transferable, revocable license.' Which right does the licensee NOT have?",
     "Using the product,Transferring the license,Accessing for personal use,Reading the documentation", "B",
     "చట్టపరమైన నిబంధన: 'లైసెన్సర్ లైసెన్సీకి ప్రత్యేకత లేని, బదిలీ చేయలేని లైసెన్స్ ఇస్తున్నారు.' లైసెన్సీకి ఏ హక్కు లేదు?",
     "ఉత్పత్తి వాడటం,లైసెన్స్ బదిలీ చేయడం,వ్యక్తిగత వినియోగం కోసం యాక్సెస్,డాక్యుమెంటేషన్ చదవడం",
     None, None),

    ("q-read-5-3", "Reading", "reading", 5, "fill_blank",
     "Corporate memo: 'All employees are required to ___ the updated data-handling policy by Friday.' Choose the correct formal word.",
     "acknowledge,feel,ignore,guess", "A",
     "కార్పొరేట్ మెమో: 'అన్ని ఉద్యోగులు శుక్రవారం కల్లా నవీకరించిన డేటా పాలసీని ___ చేయాలి.' సరైన అధికారిక పదం ఎంచుకోండి.",
     "acknowledge,feel,ignore,guess",
     None, None),

    # === WRITING (12 existing + 3 difficulty-5) ===
    # Difficulty 1
    ("q-write-1-1", "Writing", "writing", 1, "mcq",
     "Which is the lowercase letter for 'G'?",
     "g,q,p,d", "A",
     "'G' అక్షరానికి చిన్న అక్షరం (lowercase) ఏది?",
     "g,q,p,d",
     None, None),

    ("q-write-1-2", "Writing", "writing", 1, "fill_blank",
     "Complete the word: 'C_T' (the meowing animal)",
     "A,E,I,O", "A",
     "పదాన్ని పూరించండి: 'C_T' (మ్యావ్ అనే జంతువు)",
     "A,E,I,O",
     None, None),

    ("q-write-1-3", "Writing", "writing", 1, "mcq",
     "Which character ends a sentence?",
     "Comma,Period,Colon,Dash", "B",
     "వాక్యం చివర ఏ గుర్తు వస్తుంది?",
     "కామా (Comma),ఫుల్‌స్టాప్ (Period),కోలన్ (Colon),డాష్ (Dash)",
     None, None),

    # Difficulty 2
    ("q-write-2-1", "Writing", "writing", 2, "mcq",
     "Write the plural form of 'Book'.",
     "Books,Bookes,Bookies,Book", "A",
     "'Book' యొక్క బహువచనం ఏది?",
     "Books,Bookes,Bookies,Book",
     None, None),

    ("q-write-2-2", "Writing", "writing", 2, "arrange",
     "Arrange the words in the correct order: 'like / I / apples'",
     "apples like I,I like apples,like apples I,I apples like", "B",
     "పదాలను సరైన క్రమంలో అమర్చండి: 'like / I / apples'",
     "apples like I,I like apples,like apples I,I apples like",
     None, None),

    ("q-write-2-3", "Writing", "writing", 2, "fill_blank",
     "Complete the sentence: 'He ___ playing football.'",
     "is,are,am,be", "A",
     "వాక్యాన్ని పూరించండి: 'He ___ playing football.'",
     "is,are,am,be",
     None, None),

    # Difficulty 3
    ("q-write-3-1", "Writing", "writing", 3, "mcq",
     "Select the sentence with correct punctuation.",
     "where are you going,Where are you going?,Where are you going.,where are you going!", "B",
     "సరైన విరామ చిహ్నాలు గల వాక్యాన్ని ఎంచుకోండి.",
     "where are you going,Where are you going?,Where are you going.,where are you going!",
     None, None),

    ("q-write-3-2", "Writing", "writing", 3, "arrange",
     "Arrange the words into a sentence: 'market / to / went / Latha / yesterday'",
     "yesterday Latha went market to,Latha went to market yesterday,market to Latha went yesterday,Latha yesterday market went to", "B",
     "వాక్యాన్ని అమర్చండి: 'market / to / went / Latha / yesterday'",
     "yesterday Latha went market to,Latha went to market yesterday,market to Latha went yesterday,Latha yesterday market went to",
     None, None),

    ("q-write-3-3", "Writing", "writing", 3, "fill_blank",
     "Fill in the preposition: 'She is sitting ___ the chair.'",
     "on,in,at,to", "A",
     "విభక్తి (preposition) పూరించండి: 'She is sitting ___ the chair.'",
     "on,in,at,to",
     None, None),

    # Difficulty 4
    ("q-write-4-1", "Writing", "writing", 4, "mcq",
     "Identify the sentence with the grammatically correct tense.",
     "She has wrote a letter,She writes a letter yesterday,She wrote a letter yesterday,She write a letter", "C",
     "వ్యాకరణపరంగా సరైన వాక్యాన్ని ఎంచుకోండి.",
     "She has wrote a letter,She writes a letter yesterday,She wrote a letter yesterday,She write a letter",
     None, None),

    ("q-write-4-2", "Writing", "writing", 4, "fill_blank",
     "Fill in the conjunction: 'He is poor ___ he is honest.'",
     "but,or,so,because", "A",
     "ఖాళీని పూరించండి: 'He is poor ___ he is honest.'",
     "but,or,so,because",
     None, None),

    ("q-write-4-3", "Writing", "writing", 4, "mcq",
     "Select the passive voice of: 'Rama killed Ravana.'",
     "Ravana killed Rama,Ravana was killed by Rama,Rama was killed by Ravana,Ravana kills Rama", "B",
     "సరైన కర్మణి ప్రయోగం (passive voice) ఎంచుకోండి: 'Rama killed Ravana.'",
     "Ravana killed Rama,Ravana was killed by Rama,Rama was killed by Ravana,Ravana kills Rama",
     None, None),

    # Difficulty 5 — Writing
    ("q-write-5-1", "Writing", "writing", 5, "mcq",
     "Choose the sentence that correctly uses the subjunctive mood.",
     "If I was rich, I would travel.,If I were rich, I would travel.,If I am rich, I will travel.,If I be rich, I travel.", "B",
     "Subjunctive mood ని సరిగా ఉపయోగించే వాక్యాన్ని ఎంచుకోండి.",
     "If I was rich, I would travel.,If I were rich, I would travel.,If I am rich, I will travel.,If I be rich, I travel.",
     None, None),

    ("q-write-5-2", "Writing", "writing", 5, "fill_blank",
     "Complete the formal letter closing: 'Thank you for your consideration. I look forward to ___ from you.'",
     "hearing,hear,heard,to hear", "A",
     "అధికారిక లేఖ ముగింపు పూరించండి: 'Thank you for your consideration. I look forward to ___ from you.'",
     "hearing,hear,heard,to hear",
     None, None),

    ("q-write-5-3", "Writing", "writing", 5, "arrange",
     "Arrange into a correct complex sentence with a relative clause: 'won / the / who / the / student / award / studied / hardest'",
     "the student who studied hardest won the award,who the student studied hardest won award the,award the won student who hardest studied,the who student award hardest won studied", "A",
     "సరైన relative clause వాక్యంలో అమర్చండి.",
     "the student who studied hardest won the award,who the student studied hardest won award the,award the won student who hardest studied,the who student award hardest won studied",
     None, None),
]


async def main():
    try:
        print(f"DATABASE_URL: {settings.DATABASE_URL}")
        engine = create_async_engine(settings.DATABASE_URL, connect_args={"statement_cache_size": 0})
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

                en_options_list = [{"id": chr(65 + i), "text": opt} for i, opt in enumerate(en_opts.split(","))]
                te_options_list = [{"id": chr(65 + i), "text": opt} for i, opt in enumerate(te_opts.split(","))]

                # Insert logical English question with media fields
                await conn.execute(
                    text("""
                        INSERT INTO questions (
                            id, learning_goal, domain, skill, difficulty, question_type,
                            language, question_content, options, correct_answer, is_active,
                            audio_url, image_url
                        ) VALUES (
                            :id, :lg, :domain, :skill, :diff, :q_type,
                            'en', :q_content, :options, :correct, True,
                            :audio_url, :image_url
                        )
                    """),
                    {
                        "id": q_id,
                        "lg": f"Adaptive {domain}",
                        "domain": domain,
                        "skill": skill,
                        "diff": diff,
                        "q_type": q_type,
                        "q_content": json.dumps({"text": en_prompt}),
                        "options": json.dumps(en_options_list),
                        "correct": json.dumps(correct),
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
                    "correct_answer": correct
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
            print(f"Successfully seeded {seeded} questions and translations.")
            diff_counts = {}
            skill_counts = {}
            for row in Q_DATA:
                d, s = row[3], row[2]
                diff_counts[d] = diff_counts.get(d, 0) + 1
                skill_counts[s] = skill_counts.get(s, 0) + 1
            print(f"By difficulty: {dict(sorted(diff_counts.items()))}")
            print(f"By skill:      {dict(sorted(skill_counts.items()))}")

    except Exception as e:
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
