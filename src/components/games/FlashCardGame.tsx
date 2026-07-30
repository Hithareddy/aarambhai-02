import React, { useEffect, useState, useRef } from 'react';
import { GameContainer } from './GameContainer';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle2, XCircle, Volume2, RefreshCw, ArrowLeft, Clock, Award, Sparkles, HelpCircle, BookOpen } from 'lucide-react';

export interface FlashCardChoice {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface InteractiveFlashCard {
  id: string;
  category: string;
  modeLabel: string;
  questionText: string;
  image?: string;
  audioText?: string;
  options: FlashCardChoice[];
  explanation: string;
  exampleSentence: string;
}

export const INTERACTIVE_FLASHCARDS: InteractiveFlashCard[] = [
  // 1. Word -> Meaning
  {
    id: 'fc-1',
    category: 'Word -> Meaning',
    modeLabel: 'Vocabulary Meaning',
    questionText: "What is the meaning of 'Generous'?",
    options: [
      { id: 'a', text: 'Willing to give and share freely', isCorrect: true },
      { id: 'b', text: 'Angry and easily annoyed', isCorrect: false },
      { id: 'c', text: 'Moving at a very fast speed', isCorrect: false },
      { id: 'd', text: 'Heavy and difficult to carry', isCorrect: false },
    ],
    explanation: "'Generous' describes someone who is happy to give time, money, or help to others.",
    exampleSentence: "She is very generous and always shares her lunch with friends.",
  },

  // 2. Word -> Opposite
  {
    id: 'fc-2',
    category: 'Word -> Opposite',
    modeLabel: 'Antonyms',
    questionText: "What is the opposite (antonym) of 'Ancient'?",
    options: [
      { id: 'a', text: 'Modern', isCorrect: true },
      { id: 'b', text: 'Historical', isCorrect: false },
      { id: 'c', text: 'Gigantic', isCorrect: false },
      { id: 'd', text: 'Heavy', isCorrect: false },
    ],
    explanation: "'Ancient' means belonging to the distant past, so its opposite is 'Modern'.",
    exampleSentence: "Smartphones are a feature of modern everyday life.",
  },

  // 3. Picture -> Word
  {
    id: 'fc-3',
    category: 'Picture -> Word',
    modeLabel: 'Visual Recognition',
    questionText: 'Which word matches the image below?',
    image: '/images/fruits/apple.svg',
    options: [
      { id: 'a', text: 'Apple', isCorrect: true },
      { id: 'b', text: 'Orange', isCorrect: false },
      { id: 'c', text: 'Mango', isCorrect: false },
      { id: 'd', text: 'Banana', isCorrect: false },
    ],
    explanation: 'An apple is a sweet, edible fruit produced by an apple tree.',
    exampleSentence: 'An apple a day keeps the doctor away.',
  },

  // 4. Picture -> Meaning
  {
    id: 'fc-4',
    category: 'Picture -> Meaning',
    modeLabel: 'Object Purpose',
    questionText: 'What is the primary function of a Clock?',
    image: '/images/objects/clock.svg',
    options: [
      { id: 'a', text: 'To measure and display time', isCorrect: true },
      { id: 'b', text: 'To play audio music', isCorrect: false },
      { id: 'c', text: 'To store printed books', isCorrect: false },
      { id: 'd', text: 'To cook warm meals', isCorrect: false },
    ],
    explanation: 'A clock is a device used to measure, verify, and indicate time.',
    exampleSentence: 'The wall clock shows that it is 3:00 PM.',
  },

  // 5. Color Recognition
  {
    id: 'fc-5',
    category: 'Color Recognition',
    modeLabel: 'Colors',
    questionText: 'Identify the color shown in the card:',
    image: '/images/colors/red.svg',
    options: [
      { id: 'a', text: 'Red', isCorrect: true },
      { id: 'b', text: 'Blue', isCorrect: false },
      { id: 'c', text: 'Green', isCorrect: false },
      { id: 'd', text: 'Purple', isCorrect: false },
    ],
    explanation: 'Red is the color of ripe strawberries and traffic stop signals.',
    exampleSentence: 'She wore a bright red jacket on her walk.',
  },

  // 6. Fruits
  {
    id: 'fc-6',
    category: 'Fruits',
    modeLabel: 'Fruit Category',
    questionText: 'Identify this tropical yellow fruit:',
    image: '/images/fruits/banana.svg',
    options: [
      { id: 'a', text: 'Banana', isCorrect: true },
      { id: 'b', text: 'Grapes', isCorrect: false },
      { id: 'c', text: 'Lemon', isCorrect: false },
      { id: 'd', text: 'Pear', isCorrect: false },
    ],
    explanation: 'Bananas are long curved fruits with soft sweet flesh rich in potassium.',
    exampleSentence: 'I enjoy a fresh banana with my breakfast cereal.',
  },

  // 7. Vegetables
  {
    id: 'fc-7',
    category: 'Vegetables',
    modeLabel: 'Healthy Foods',
    questionText: 'Which of the following is a healthy green leafy vegetable?',
    options: [
      { id: 'a', text: 'Spinach', isCorrect: true },
      { id: 'b', text: 'Cupcake', isCorrect: false },
      { id: 'c', text: 'Potato Chips', isCorrect: false },
      { id: 'd', text: 'Ice Cream', isCorrect: false },
    ],
    explanation: 'Spinach is a leafy green vegetable rich in iron and essential vitamins.',
    exampleSentence: 'Eating fresh spinach helps build strong muscles.',
  },

  // 8. Animals
  {
    id: 'fc-8',
    category: 'Animals',
    modeLabel: 'Wild Animals',
    questionText: 'Which majestic animal is shown below?',
    image: '/images/animals/lion.svg',
    options: [
      { id: 'a', text: 'Lion', isCorrect: true },
      { id: 'b', text: 'Elephant', isCorrect: false },
      { id: 'c', text: 'Rabbit', isCorrect: false },
      { id: 'd', text: 'Cat', isCorrect: false },
    ],
    explanation: 'Lions are large wild cats known for their impressive manes.',
    exampleSentence: 'The lion rested quietly under the shady acacia tree.',
  },

  // 9. Birds
  {
    id: 'fc-9',
    category: 'Birds',
    modeLabel: 'Avian Life',
    questionText: 'Which bird is famous for its bright, colorful fan tail feathers?',
    options: [
      { id: 'a', text: 'Peacock', isCorrect: true },
      { id: 'b', text: 'Sparrow', isCorrect: false },
      { id: 'c', text: 'Crow', isCorrect: false },
      { id: 'd', text: 'Pigeon', isCorrect: false },
    ],
    explanation: 'Peacocks display magnificent blue and green tail feathers during courtship.',
    exampleSentence: 'The peacock opened its colorful tail feathers in the sanctuary.',
  },

  // 10. Family Members
  {
    id: 'fc-10',
    category: 'Family Members',
    modeLabel: 'Relationships',
    questionText: "Your mother's or father's sister is called your ___:",
    options: [
      { id: 'a', text: 'Aunt', isCorrect: true },
      { id: 'b', text: 'Grandmother', isCorrect: false },
      { id: 'c', text: 'Cousin', isCorrect: false },
      { id: 'd', text: 'Niece', isCorrect: false },
    ],
    explanation: "An aunt is the sister of one's mother or father.",
    exampleSentence: 'My aunt brought delicious home-made sweets when she visited.',
  },

  // 11. Everyday Objects
  {
    id: 'fc-11',
    category: 'Everyday Objects',
    modeLabel: 'Daily Items',
    questionText: 'Which object is used for writing or sketching on paper?',
    image: '/images/objects/pencil.svg',
    options: [
      { id: 'a', text: 'Pencil', isCorrect: true },
      { id: 'b', text: 'Spoon', isCorrect: false },
      { id: 'c', text: 'Umbrella', isCorrect: false },
      { id: 'd', text: 'Comb', isCorrect: false },
    ],
    explanation: 'A pencil is a tool with graphite core used for writing and drawing.',
    exampleSentence: 'Use a sharp pencil to fill out the practice form.',
  },

  // 12. Fill Missing Letter
  {
    id: 'fc-12',
    category: 'Fill Missing Letter',
    modeLabel: 'Spelling Challenge',
    questionText: 'Complete the missing letter: S _ N (The star that gives light to Earth)',
    options: [
      { id: 'a', text: 'U', isCorrect: true },
      { id: 'b', text: 'O', isCorrect: false },
      { id: 'c', text: 'A', isCorrect: false },
      { id: 'd', text: 'E', isCorrect: false },
    ],
    explanation: 'SUN is spelled S-U-N.',
    exampleSentence: 'The sun rises in the east every morning.',
  },

  // 13. Sentence Meaning
  {
    id: 'fc-13',
    category: 'Sentence Meaning',
    modeLabel: 'Idioms & Usage',
    questionText: "What does the expression 'Under the weather' mean?",
    options: [
      { id: 'a', text: 'Feeling slightly sick or unwell', isCorrect: true },
      { id: 'b', text: 'Standing outside in heavy rain', isCorrect: false },
      { id: 'c', text: 'Enjoying cold winter breezes', isCorrect: false },
      { id: 'd', text: 'Watching a weather report', isCorrect: false },
    ],
    explanation: "'Under the weather' is an everyday phrase meaning feeling ill or unwell.",
    exampleSentence: 'He stayed home today because he felt under the weather.',
  },

  // 14. Audio Recognition
  {
    id: 'fc-14',
    category: 'Audio Recognition',
    modeLabel: 'Listening Skills',
    questionText: "Press 'Listen' and identify the spoken place word:",
    audioText: 'Hospital',
    options: [
      { id: 'a', text: 'Hospital', isCorrect: true },
      { id: 'b', text: 'Airport', isCorrect: false },
      { id: 'c', text: 'School', isCorrect: false },
      { id: 'd', text: 'Library', isCorrect: false },
    ],
    explanation: 'Hospital refers to a medical institution providing patient treatment.',
    exampleSentence: 'The ambulance arrived quickly at the city hospital.',
  },
];

export function FlashCardGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<'instructions' | 'playing' | 'completed'>('instructions');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deck, setDeck] = useState<InteractiveFlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Stats tracking
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initializeDeck = (cat: string = 'all') => {
    let items = INTERACTIVE_FLASHCARDS;
    if (cat !== 'all') {
      items = INTERACTIVE_FLASHCARDS.filter((item) => item.category === cat);
    }
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setElapsedSeconds(0);
    setSelectedOptionId(null);
    setIsCorrect(null);
  };

  const handleStartGame = () => {
    initializeDeck(selectedCategory);
    setGameState('playing');
  };

  const handleRestart = () => {
    initializeDeck(selectedCategory);
    setGameState('playing');
  };

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const activeCard = deck[currentIndex];

  const handleSelectOption = (opt: FlashCardChoice) => {
    if (selectedOptionId !== null) return;

    setSelectedOptionId(opt.id);
    setIsCorrect(opt.isCorrect);

    speakText(opt.text);

    if (opt.isCorrect) {
      setScore((s) => s + 15);
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNextCard = () => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((c) => c + 1);
      setSelectedOptionId(null);
      setIsCorrect(null);
    } else {
      setGameState('completed');
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const accuracyPercent = deck.length > 0 ? Math.round((correctCount / (currentIndex + (selectedOptionId ? 1 : 0))) * 100) || 0 : 0;
  const finalAccuracy = deck.length > 0 ? Math.round((correctCount / deck.length) * 100) : 0;
  const progressPercent = deck.length > 0 ? Math.round(((currentIndex + 1) / deck.length) * 100) : 0;

  const availableCategories = Array.from(new Set(INTERACTIVE_FLASHCARDS.map((fc) => fc.category)));

  return (
    <GameContainer
      title="Interactive Flash Cards"
      progress={gameState === 'playing' ? progressPercent : gameState === 'completed' ? 100 : 0}
      onExit={onExit}
      score={score}
    >
      {gameState === 'instructions' && (
        <div className="flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-300 py-6">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-4xl shadow-inner">
            🃏
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Interactive Flash Cards</h2>
            <p className="text-muted-foreground mt-2 text-balance leading-relaxed">
              Test your vocabulary, antonyms, images, spelling, idioms, and speech recognition through active practice questions!
            </p>
          </div>

          {/* Mode / Category Selector */}
          <div className="w-full space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block text-left">
              Select Learning Category:
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-muted/30 rounded-2xl border">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="rounded-xl font-bold text-xs"
              >
                All Modes (14)
              </Button>
              {availableCategories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-xl font-bold text-xs"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-muted/40 p-4 rounded-2xl border text-left text-xs text-muted-foreground space-y-2 w-full">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span>Learning Features:</span>
            </div>
            <p>1. Read the interactive question and select from 4 choices.</p>
            <p>2. View instant explanations and example sentences.</p>
            <p>3. Tracks your score (+15 XP), accuracy %, progress, and time.</p>
          </div>

          <div className="flex gap-3 w-full">
            <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={handleStartGame}>
              Start Learning Activity 🚀
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-2xl" onClick={onExit}>
              Exit
            </Button>
          </div>
        </div>
      )}

      {gameState === 'playing' && activeCard && (
        <div className="flex flex-col items-center w-full max-w-xl space-y-6 animate-in fade-in zoom-in duration-300">
          {/* Header Bar Stats */}
          <div className="flex items-center justify-between w-full px-4 py-2.5 bg-card rounded-2xl border text-xs font-bold text-muted-foreground shadow-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                {activeCard.modeLabel}
              </Badge>
              <span>Card {currentIndex + 1} of {deck.length}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {formatTime(elapsedSeconds)}
              </span>
              <span className="text-emerald-600 font-extrabold">Accuracy: {accuracyPercent}%</span>
            </div>
          </div>

          {/* Interactive Question Card */}
          <Card className="w-full p-6 sm:p-8 rounded-3xl border-2 border-primary/20 bg-card shadow-md space-y-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-snug">
                {activeCard.questionText}
              </h3>

              {/* Audio Listen Button */}
              {(activeCard.audioText || activeCard.questionText) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-1.5 text-xs font-bold shrink-0 border-primary/30 text-primary"
                  onClick={() => speakText(activeCard.audioText || activeCard.questionText)}
                >
                  <Volume2 className="h-4 w-4" />
                  Listen
                </Button>
              )}
            </div>

            {/* Optional Image Display */}
            {activeCard.image && (
              <div className="w-full h-48 bg-white dark:bg-card/80 border-2 border-primary/10 rounded-2xl flex items-center justify-center p-4">
                <img src={activeCard.image} alt="Question prompt visual" className="h-full object-contain drop-shadow" />
              </div>
            )}

            {/* 4 Choice Option Buttons */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              {activeCard.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;

                let btnClass = 'bg-muted/30 border-border/80 text-foreground hover:border-primary/50 hover:bg-primary/5';
                if (isSelected) {
                  if (opt.isCorrect) {
                    btnClass = 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                  } else {
                    btnClass = 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    disabled={selectedOptionId !== null}
                    className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-base transition-all flex items-center justify-between shadow-sm ${btnClass}`}
                  >
                    <span>{opt.text}</span>
                    {isSelected && (
                      <span>
                        {opt.isCorrect ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <XCircle className="h-5 w-5 text-rose-600 shrink-0" />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Example Sentence Overlay */}
            {selectedOptionId !== null && (
              <div className="space-y-4 pt-4 border-t border-border/60 animate-in slide-in-from-bottom-2 duration-300">
                <div className={`p-4 rounded-2xl border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                  <div className="flex items-center gap-2 font-bold text-sm mb-1">
                    {isCorrect ? (
                      <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Correct Choice! (+15 XP)
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <XCircle className="h-4 w-4" /> Recorded — Explanation Below:
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{activeCard.explanation}</p>

                  <div className="mt-3 pt-3 border-t border-border/40 text-xs">
                    <span className="font-bold text-foreground block mb-0.5">Example Sentence:</span>
                    <span className="italic text-muted-foreground">"{activeCard.exampleSentence}"</span>
                  </div>
                </div>

                <Button size="lg" className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={handleNextCard}>
                  {currentIndex < deck.length - 1 ? 'Next Flash Card →' : 'Complete Activity 🎉'}
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {gameState === 'completed' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 animate-in slide-in-from-bottom-8 duration-400 py-8">
          <div className="text-7xl animate-bounce">🎓</div>
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold">Flash Card Activity Complete!</h2>
            <p className="text-muted-foreground text-sm">Great vocabulary and active practice milestone!</p>
          </div>

          {/* Results Summary Card */}
          <Card className="p-6 w-full rounded-3xl border-primary/20 bg-primary/5 space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-border/60">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total XP</div>
                <div className="text-3xl font-black text-primary">+{score}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Accuracy</div>
                <div className="text-3xl font-black text-emerald-600">{finalAccuracy}%</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</div>
                <div className="text-2xl font-black text-foreground">{formatTime(elapsedSeconds)}</div>
              </div>
            </div>

            <div className="pt-2 text-xs text-muted-foreground border-t border-border/40">
              Completed <strong>{deck.length}</strong> interactive flash card questions.
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold gap-2 shadow-lg" onClick={handleRestart}>
              <RefreshCw className="h-5 w-5" />
              Practice Again
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-2xl gap-2" onClick={onExit}>
              <ArrowLeft className="h-5 w-5" />
              Back to Games
            </Button>
          </div>
        </div>
      )}
    </GameContainer>
  );
}
