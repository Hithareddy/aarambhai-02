import { LanguageCode } from '@/locales';

export interface MultilingualItem {
  id: string;
  category: 'fruits' | 'animals' | 'vehicles' | 'objects' | 'colors' | 'food';
  image: string;
  word: Record<LanguageCode, string>;
  meaning: Record<LanguageCode, string>;
  pronunciation: Record<LanguageCode, string>;
  exampleSentence: Record<LanguageCode, string>;
}

export const MULTILINGUAL_VOCABULARY: MultilingualItem[] = [
  // 1. APPLE
  {
    id: 'apple',
    category: 'fruits',
    image: '/images/fruits/apple.svg',
    word: {
      en: 'Apple',
      te: 'ఆపిల్ (Apil)',
      hi: 'सेब (Seb)',
      ta: 'ஆப்பிள் (Appil)',
      mr: 'सफरचंद (Saparchand)',
    },
    meaning: {
      en: 'A sweet red or green fruit',
      te: 'ఒక తీపి ఎర్రటి లేదా ఆకుపచ్చ పండు',
      hi: 'एक मीठा लाल या हरा फल',
      ta: 'ஒரு இனிப்பான சிவப்பு அல்லது பச்சை பழம்',
      mr: 'एक गोड लाल किंवा हिरवे फळ',
    },
    pronunciation: {
      en: 'ap-pul',
      te: 'ఆ-పి-ల్',
      hi: 'से-ब',
      ta: 'ஆப்-பி-ள்',
      mr: 'स-फ-र-चं-द',
    },
    exampleSentence: {
      en: 'An apple a day keeps the doctor away.',
      te: 'రోజుకో ఆపిల్ తింటే ఆరోగ్యం బాగుంటుంది.',
      hi: 'रोज एक सेब खाने से बीमारी दूर रहती है।',
      ta: 'தினமும் ஒரு ஆப்பிள் சாப்பிடுவது நல்லது.',
      mr: 'दररोज एक सफरचंद खाल्ल्याने आरोग्य चांगले राहते.',
    },
  },
  // 2. BANANA
  {
    id: 'banana',
    category: 'fruits',
    image: '/images/fruits/banana.svg',
    word: {
      en: 'Banana',
      te: 'అరటిపండు (Aratipandu)',
      hi: 'केला (Kela)',
      ta: 'வாழைப்பழம் (Vazhaippazham)',
      mr: 'केळी (Keli)',
    },
    meaning: {
      en: 'A long yellow fruit',
      te: 'ఒక పొడవైన పసుపు పండు',
      hi: 'एक लंबा पीला फल',
      ta: 'நீளமான மஞ்சள் பழம்',
      mr: 'लांब पिवळे फळ',
    },
    pronunciation: {
      en: 'buh-na-nuh',
      te: 'అ-ర-టి-పం-డు',
      hi: 'కే-లా',
      ta: 'వా-ళై-ప్-ప-ழ-మ్',
      mr: 'కే-ళీ',
    },
    exampleSentence: {
      en: 'Bananas give us quick energy.',
      te: 'అరటిపండ్లు మనకు తక్షణ శక్తినిస్తాయి.',
      hi: 'केला खाने से तुरंत ऊर्जा मिलती है।',
      ta: 'வாழைப்பழம் நமக்கு உடனடி ஆற்றலைத் தரும்.',
      mr: 'केळी खाल्ल्याने त्वरित ऊर्जा मिळते.',
    },
  },
  // 3. DOG
  {
    id: 'dog',
    category: 'animals',
    image: '/images/animals/dog.svg',
    word: {
      en: 'Dog',
      te: 'కుక్క (Kukka)',
      hi: 'कुत्ता (Kutta)',
      ta: 'நாய் (Naai)',
      mr: 'कुत्रा (Kutra)',
    },
    meaning: {
      en: 'A loyal domestic animal',
      te: 'విశ్వాసం గల పెంపుడు జంతువు',
      hi: 'एक वफादार पालतू जानवर',
      ta: 'நம்பிக்கையான செல்லப் பிராணி',
      mr: 'एक विश्वासू पाळीव प्राणी',
    },
    pronunciation: {
      en: 'dog',
      te: 'కు-క్క',
      hi: 'కు-త్తా',
      ta: 'నా-య్',
      mr: 'కు-త్రా',
    },
    exampleSentence: {
      en: 'The dog barks when a friend arrives.',
      te: 'స్నేహితుడు వచ్చినప్పుడు కుక్క మొరుగుతుంది.',
      hi: 'मित्र के आने पर कुत्ता भौंकता है।',
      ta: 'நண்பர் வரும்போது நாய் குரைக்கும்.',
      mr: 'मित्र आल्यावर कुत्रा भुंकतो.',
    },
  },
  // 4. CAR
  {
    id: 'car',
    category: 'vehicles',
    image: '/images/vehicles/car.svg',
    word: {
      en: 'Car',
      te: 'కారు (Kaaru)',
      hi: 'कार (Kaar)',
      ta: 'கார் (Kaar)',
      mr: 'गाडी (Gaadi)',
    },
    meaning: {
      en: 'A four-wheeled road vehicle',
      te: 'నాలుగు చక్రాల వాహనం',
      hi: 'चार पहियों वाला वाहन',
      ta: 'நான்கு சக்கர வாகனம்',
      mr: 'चार चाकी वाहन',
    },
    pronunciation: {
      en: 'kaar',
      te: 'కా-రు',
      hi: 'కా-ర్',
      ta: 'కా-ర్',
      mr: 'గా-డీ',
    },
    exampleSentence: {
      en: 'We travel safely in the red car.',
      te: 'మేము ఎర్రటి కారులో సురక్షితంగా ప్రయాణిస్తాము.',
      hi: 'हम लाल कार में सुरक्षित यात्रा करते हैं।',
      ta: 'நாங்கள் சிவப்பு காரில் பாதுகாப்பாகப் பயணம் செய்கிறோம்.',
      mr: 'आम्ही लाल गाडीतून सुरक्षित प्रवास करतो.',
    },
  },
];

// Speak Text using Web SpeechSynthesis adapting to selected language
export function speakMultilingualText(text: string, lang: LanguageCode) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const langMap: Record<LanguageCode, string> = {
    en: 'en-US',
    te: 'te-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    mr: 'mr-IN',
  };

  const u = new SpeechSynthesisUtterance(text);
  u.lang = langMap[lang] || 'en-US';
  u.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
