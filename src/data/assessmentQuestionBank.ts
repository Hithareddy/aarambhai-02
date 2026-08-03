export type AssessmentQuestionType =
  | 'picture_id'
  | 'image_select'
  | 'color_id'
  | 'animal_id'
  | 'fruit_id'
  | 'vegetable_id'
  | 'bird_id'
  | 'vehicle_id'
  | 'object_id'
  | 'family_id'
  | 'matching'
  | 'fill_blank'
  | 'arrange_letters'
  | 'arrange_words'
  | 'odd_one_out'
  | 'categorization'
  | 'true_false'
  | 'listening_image'
  | 'listening_mcq'
  | 'speaking'
  | 'read_select'
  | 'read_sentence'
  | 'everyday_communication'
  | 'shopping'
  | 'bus_stand'
  | 'atm'
  | 'medicine_label'
  | 'road_signs'
  | 'weather'
  | 'time_clock';

export interface AssessmentOption {
  id: string;
  text: string;
  image?: string;
  isCorrect?: boolean;
}

export interface BankQuestion {
  id: string;
  type: AssessmentQuestionType;
  difficulty: 1 | 2 | 3;
  category: string;
  questionText: string;
  stimulus?: string;
  passage?: string;
  scenario?: string;
  audioText?: string;
  image?: string;
  options: AssessmentOption[];
  correctAnswer: string | string[];
  matchingPairs?: { left: string; right: string; rightImage?: string }[];
  categorizationBuckets?: { category: string; items: string[] }[];
  scrambledLetters?: string;
  targetWord?: string;
  scrambledWords?: string[];
  explanation?: string;
}

export const QUESTION_BANK: BankQuestion[] = [
  // --- 1. PICTURE IDENTIFICATION (3-4 Items in Deck) ---
  {
    id: 'q-pic-apple',
    type: 'picture_id',
    difficulty: 1,
    category: 'Fruits',
    questionText: 'What fruit is shown in the picture?',
    image: '/images/fruits/apple.svg',
    options: [
      { id: 'opt-1', text: 'Apple' },
      { id: 'opt-2', text: 'Banana' },
      { id: 'opt-3', text: 'Orange' },
      { id: 'opt-4', text: 'Mango' },
    ],
    correctAnswer: 'opt-1',
  },
  {
    id: 'q-pic-car',
    type: 'picture_id',
    difficulty: 1,
    category: 'Vehicles',
    questionText: 'What vehicle is this?',
    image: '/images/vehicles/car.svg',
    options: [
      { id: 'opt-1', text: 'Car' },
      { id: 'opt-2', text: 'Bus' },
      { id: 'opt-3', text: 'Train' },
      { id: 'opt-4', text: 'Bicycle' },
    ],
    correctAnswer: 'opt-1',
  },
  {
    id: 'q-pic-clock',
    type: 'picture_id',
    difficulty: 1,
    category: 'Household Objects',
    questionText: 'What object tells the time?',
    image: '/images/objects/clock.svg',
    options: [
      { id: 'opt-1', text: 'Clock' },
      { id: 'opt-2', text: 'Book' },
      { id: 'opt-3', text: 'Chair' },
      { id: 'opt-4', text: 'Pencil' },
    ],
    correctAnswer: 'opt-1',
  },
  {
    id: 'q-pic-red',
    type: 'picture_id',
    difficulty: 1,
    category: 'Colors',
    questionText: 'Identify this color:',
    image: '/images/colors/red.svg',
    options: [
      { id: 'opt-1', text: 'Red' },
      { id: 'opt-2', text: 'Blue' },
      { id: 'opt-3', text: 'Green' },
      { id: 'opt-4', text: 'Yellow' },
    ],
    correctAnswer: 'opt-1',
  },

  // --- 2. PICTURE SELECTION (2-3 Items in Deck) ---
  {
    id: 'q-img-dog',
    type: 'image_select',
    difficulty: 1,
    category: 'Animals',
    questionText: 'Select the picture of a Dog:',
    options: [
      { id: 'opt-dog', text: 'Dog', image: '/images/animals/dog.svg' },
      { id: 'opt-cat', text: 'Cat', image: '/images/animals/cat.svg' },
      { id: 'opt-lion', text: 'Lion', image: '/images/animals/lion.svg' },
      { id: 'opt-rabbit', text: 'Rabbit', image: '/images/animals/rabbit.svg' },
    ],
    correctAnswer: 'opt-dog',
  },
  {
    id: 'q-img-banana',
    type: 'image_select',
    difficulty: 1,
    category: 'Fruits',
    questionText: 'Select the picture of a Banana:',
    options: [
      { id: 'opt-ban', text: 'Banana', image: '/images/fruits/banana.svg' },
      { id: 'opt-app', text: 'Apple', image: '/images/fruits/apple.svg' },
      { id: 'opt-mng', text: 'Mango', image: '/images/fruits/mango.svg' },
      { id: 'opt-org', text: 'Orange', image: '/images/fruits/orange.svg' },
    ],
    correctAnswer: 'opt-ban',
  },
  {
    id: 'q-img-bus',
    type: 'image_select',
    difficulty: 1,
    category: 'Vehicles',
    questionText: 'Select the picture of a Bus:',
    options: [
      { id: 'opt-bus', text: 'Bus', image: '/images/vehicles/bus.svg' },
      { id: 'opt-car', text: 'Car', image: '/images/vehicles/car.svg' },
      { id: 'opt-bik', text: 'Bicycle', image: '/images/vehicles/bicycle.svg' },
      { id: 'opt-pln', text: 'Airplane', image: '/images/vehicles/airplane.svg' },
    ],
    correctAnswer: 'opt-bus',
  },

  // --- 3. FILL IN THE BLANK (2 Items in Deck) (No forced image!) ---
  {
    id: 'q-fib-sky',
    type: 'fill_blank',
    difficulty: 1,
    category: 'Grammar',
    questionText: 'The sky is ______ on a clear sunny afternoon.',
    options: [
      { id: 'opt-1', text: 'Blue' },
      { id: 'opt-2', text: 'Green' },
      { id: 'opt-3', text: 'Yellow' },
      { id: 'opt-4', text: 'Red' },
    ],
    correctAnswer: 'opt-1',
  },
  {
    id: 'q-fib-grass',
    type: 'fill_blank',
    difficulty: 1,
    category: 'Grammar',
    questionText: 'Fresh lawn grass is ______.',
    options: [
      { id: 'opt-1', text: 'Green' },
      { id: 'opt-2', text: 'Blue' },
      { id: 'opt-3', text: 'Purple' },
      { id: 'opt-4', text: 'Pink' },
    ],
    correctAnswer: 'opt-1',
  },

  // --- 4. ARRANGE LETTERS (2 Items in Deck) (No forced image!) ---
  {
    id: 'q-arg-ltr-apple',
    type: 'arrange_letters',
    difficulty: 2,
    category: 'Spelling',
    questionText: 'Unscramble the letters to spell the fruit name:',
    scrambledLetters: 'PPAEL',
    targetWord: 'APPLE',
    options: [],
    correctAnswer: 'APPLE',
  },
  {
    id: 'q-arg-ltr-book',
    type: 'arrange_letters',
    difficulty: 2,
    category: 'Spelling',
    questionText: 'Unscramble the letters to spell what you read:',
    scrambledLetters: 'KOOB',
    targetWord: 'BOOK',
    options: [],
    correctAnswer: 'BOOK',
  },

  // --- 5. ARRANGE WORDS (2 Items in Deck) (No forced image!) ---
  {
    id: 'q-arg-wrd-apple',
    type: 'arrange_words',
    difficulty: 2,
    category: 'Sentence Construction',
    questionText: 'Arrange the words to make a correct sentence:',
    scrambledWords: ['is', 'This', 'apple', 'an'],
    options: [],
    correctAnswer: ['This', 'is', 'an', 'apple'],
  },
  {
    id: 'q-arg-wrd-dog',
    type: 'arrange_words',
    difficulty: 2,
    category: 'Sentence Construction',
    questionText: 'Arrange the words into a complete sentence:',
    scrambledWords: ['dog', 'The', 'barks', 'loudly'],
    options: [],
    correctAnswer: ['The', 'dog', 'barks', 'loudly'],
  },

  // --- 6. MATCHING (2 Items in Deck) ---
  {
    id: 'q-mtc-pairs-1',
    type: 'matching',
    difficulty: 2,
    category: 'Matching',
    questionText: 'Match each item to its correct category:',
    options: [],
    correctAnswer: ['Apple-Fruit', 'Dog-Animal', 'Car-Vehicle', 'Book-School'],
    matchingPairs: [
      { left: 'Apple', right: 'Fruit', rightImage: '/images/fruits/apple.svg' },
      { left: 'Dog', right: 'Animal', rightImage: '/images/animals/dog.svg' },
      { left: 'Car', right: 'Vehicle', rightImage: '/images/vehicles/car.svg' },
      { left: 'Book', right: 'School', rightImage: '/images/objects/book.svg' },
    ],
  },
  {
    id: 'q-mtc-pairs-2',
    type: 'matching',
    difficulty: 2,
    category: 'Matching',
    questionText: 'Pair each object with its matching domain:',
    options: [],
    correctAnswer: ['Banana-Fruit', 'Cat-Animal', 'Bus-Vehicle', 'Pencil-School'],
    matchingPairs: [
      { left: 'Banana', right: 'Fruit', rightImage: '/images/fruits/banana.svg' },
      { left: 'Cat', right: 'Animal', rightImage: '/images/animals/cat.svg' },
      { left: 'Bus', right: 'Vehicle', rightImage: '/images/vehicles/bus.svg' },
      { left: 'Pencil', right: 'School', rightImage: '/images/objects/pencil.svg' },
    ],
  },

  // --- 7. READING QUESTIONS (2 Items in Deck) ---
  {
    id: 'q-rd-sign-stop',
    type: 'road_signs',
    difficulty: 1,
    category: 'Reading Signs',
    questionText: 'Read the road sign below. What action must a driver take?',
    image: '/images/signs/sign_stop.svg',
    options: [
      { id: 'opt-1', text: 'STOP (Halt completely)' },
      { id: 'opt-2', text: 'Drive Faster' },
      { id: 'opt-3', text: 'Turn Right Only' },
      { id: 'opt-4', text: 'Park Vehicle' },
    ],
    correctAnswer: 'opt-1',
  },
  {
    id: 'q-rd-sent-drink',
    type: 'read_sentence',
    difficulty: 2,
    category: 'Reading Comprehension',
    questionText: 'Read: "The girl is drinking water after running." Question: What is she drinking?',
    options: [
      { id: 'opt-1', text: 'Water' },
      { id: 'opt-2', text: 'Milk' },
      { id: 'opt-3', text: 'Tea' },
      { id: 'opt-4', text: 'Juice' },
    ],
    correctAnswer: 'opt-1',
  },

  // --- 8. LISTENING QUESTIONS (2 Items in Deck) ---
  {
    id: 'q-lst-phrase-1',
    type: 'listening_mcq',
    difficulty: 1,
    category: 'Listening',
    questionText: 'Listen carefully to the spoken audio clip. Question: What phrase was spoken?',
    audioText: 'This is an apple.',
    options: [
      { id: 'opt-1', text: 'This is an apple.' },
      { id: 'opt-2', text: 'This is a banana.' },
      { id: 'opt-3', text: 'This is a car.' },
      { id: 'opt-4', text: 'This is a book.' },
    ],
    correctAnswer: 'opt-1',
  },
  {
    id: 'q-lst-img-apple',
    type: 'listening_image',
    difficulty: 1,
    category: 'Listening',
    questionText: 'Press "Listen" and choose the correct matching picture:',
    audioText: 'Apple',
    options: [
      { id: 'opt-app', text: 'Apple', image: '/images/fruits/apple.svg' },
      { id: 'opt-car', text: 'Car', image: '/images/vehicles/car.svg' },
      { id: 'opt-dog', text: 'Dog', image: '/images/animals/dog.svg' },
      { id: 'opt-book', text: 'Book', image: '/images/objects/book.svg' },
    ],
    correctAnswer: 'opt-app',
  },

  // --- 9. SPEAKING QUESTIONS (2 Items in Deck) ---
  {
    id: 'q-spk-self-intro',
    type: 'speaking',
    difficulty: 1,
    category: 'Speaking',
    questionText: 'Speak out loud: Introduce yourself by saying "Hello, my name is learner."',
    audioText: 'Hello, my name is learner.',
    options: [],
    correctAnswer: 'Spoken',
  },
  {
    id: 'q-spk-pencil-img',
    type: 'speaking',
    difficulty: 1,
    category: 'Speaking',
    questionText: 'Look at the object below and say the name of this object out loud:',
    image: '/images/objects/pencil.svg',
    audioText: 'Pencil',
    options: [],
    correctAnswer: 'Pencil',
  },

  // --- 10. EVERYDAY COMMUNICATION (1 Item in Deck) ---
  {
    id: 'q-comm-shop-greeting',
    type: 'everyday_communication',
    difficulty: 1,
    category: 'Everyday Communication',
    questionText: 'Scenario: You enter a local neighborhood shop. What should you say first to the shopkeeper?',
    options: [
      { id: 'opt-1', text: 'Hello' },
      { id: 'opt-2', text: 'Thank you' },
      { id: 'opt-3', text: 'Sorry' },
      { id: 'opt-4', text: 'Goodbye' },
    ],
    correctAnswer: 'opt-1',
  },
];

/**
 * Generates a balanced 20-question assessment deck adhering strictly to the desired distribution:
 * - 3-4 Picture Identification
 * - 2-3 Picture Selection
 * - 2 Fill in the Blank
 * - 2 Arrange Letters
 * - 2 Arrange Words
 * - 2 Matching
 * - 2 Reading
 * - 2 Listening
 * - 2 Speaking
 * - 1 Everyday Communication
 */
export function generateAssessmentDeck(totalCount = 20): BankQuestion[] {
  const getPool = (type: AssessmentQuestionType) =>
    QUESTION_BANK.filter((q) => q.type === type).sort(() => Math.random() - 0.5);

  const picIdPool = QUESTION_BANK.filter((q) => q.type === 'picture_id').sort(() => Math.random() - 0.5);
  const picSelectPool = QUESTION_BANK.filter((q) => q.type === 'image_select').sort(() => Math.random() - 0.5);
  const fillBlankPool = QUESTION_BANK.filter((q) => q.type === 'fill_blank').sort(() => Math.random() - 0.5);
  const arrangeLettersPool = QUESTION_BANK.filter((q) => q.type === 'arrange_letters').sort(() => Math.random() - 0.5);
  const arrangeWordsPool = QUESTION_BANK.filter((q) => q.type === 'arrange_words').sort(() => Math.random() - 0.5);
  const matchingPool = QUESTION_BANK.filter((q) => q.type === 'matching').sort(() => Math.random() - 0.5);
  const readingPool = QUESTION_BANK.filter((q) => q.type === 'road_signs' || q.type === 'read_sentence').sort(() => Math.random() - 0.5);
  const listeningPool = QUESTION_BANK.filter((q) => q.type === 'listening_mcq' || q.type === 'listening_image').sort(() => Math.random() - 0.5);
  const speakingPool = QUESTION_BANK.filter((q) => q.type === 'speaking').sort(() => Math.random() - 0.5);
  const commPool = QUESTION_BANK.filter((q) => q.type === 'everyday_communication').sort(() => Math.random() - 0.5);

  // Interleave questions according to exact target sequence:
  // Q1 Picture ID, Q2 Fill Blank, Q3 Arrange Letters, Q4 Listening, Q5 Matching, Q6 Reading, Q7 Picture Select, Q8 Arrange Words, Q9 Speaking, Q10 Picture ID...
  const deck: BankQuestion[] = [];

  const addFrom = (pool: BankQuestion[], count: number) => {
    for (let i = 0; i < count; i++) {
      if (pool[i]) deck.push(pool[i]);
    }
  };

  addFrom(picIdPool, 2);           // Q1, Q10
  addFrom(fillBlankPool, 2);       // Q2, Q12
  addFrom(arrangeLettersPool, 2);  // Q3, Q17
  addFrom(listeningPool, 2);       // Q4, Q14
  addFrom(matchingPool, 2);        // Q5, Q16
  addFrom(readingPool, 2);         // Q6, Q19
  addFrom(picSelectPool, 2);       // Q7, Q15
  addFrom(arrangeWordsPool, 2);    // Q8, Q20
  addFrom(speakingPool, 2);        // Q9, Q18
  addFrom(commPool, 1);            // Q13
  addFrom(picIdPool.slice(2), 1);  // Q15 extra

  // Return exactly 20 items or fallback
  if (deck.length < totalCount) {
    const remaining = QUESTION_BANK.filter((q) => !deck.includes(q)).sort(() => Math.random() - 0.5);
    return [...deck, ...remaining].slice(0, totalCount);
  }

  return deck.slice(0, totalCount);
}
