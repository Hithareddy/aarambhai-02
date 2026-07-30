import React, { useState, useMemo } from 'react';
import { GameContainer } from './GameContainer';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  RefreshCw,
  ArrowLeft,
  Lightbulb,
  Shuffle,
  Eye,
  SkipForward,
  Check,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export interface FourPicsPuzzle {
  id: string;
  targetWord: string;
  category: string;
  images: { type: 'image' | 'emoji'; value: string; label: string }[];
}

// 50+ Comprehensive 4 Pics 1 Word Puzzles
export const FOUR_PICS_PUZZLES: FourPicsPuzzle[] = [
  // 1. FRUITS
  {
    id: 'f4p-1',
    targetWord: 'FRUITS',
    category: 'Food',
    images: [
      { type: 'image', value: '/images/fruits/apple.svg', label: 'Apple' },
      { type: 'image', value: '/images/fruits/banana.svg', label: 'Banana' },
      { type: 'image', value: '/images/fruits/grapes.svg', label: 'Grapes' },
      { type: 'image', value: '/images/fruits/mango.svg', label: 'Mango' },
    ],
  },
  // 2. VEHICLES
  {
    id: 'f4p-2',
    targetWord: 'VEHICLES',
    category: 'Transport',
    images: [
      { type: 'image', value: '/images/vehicles/car.svg', label: 'Car' },
      { type: 'image', value: '/images/vehicles/bus.svg', label: 'Bus' },
      { type: 'image', value: '/images/vehicles/train.svg', label: 'Train' },
      { type: 'image', value: '/images/vehicles/bicycle.svg', label: 'Bicycle' },
    ],
  },
  // 3. ANIMALS
  {
    id: 'f4p-3',
    targetWord: 'ANIMALS',
    category: 'Nature',
    images: [
      { type: 'image', value: '/images/animals/dog.svg', label: 'Dog' },
      { type: 'image', value: '/images/animals/cat.svg', label: 'Cat' },
      { type: 'image', value: '/images/animals/lion.svg', label: 'Lion' },
      { type: 'image', value: '/images/animals/elephant.svg', label: 'Elephant' },
    ],
  },
  // 4. COLORS
  {
    id: 'f4p-4',
    targetWord: 'COLORS',
    category: 'Art',
    images: [
      { type: 'image', value: '/images/colors/red.svg', label: 'Red' },
      { type: 'image', value: '/images/colors/blue.svg', label: 'Blue' },
      { type: 'image', value: '/images/colors/green.svg', label: 'Green' },
      { type: 'image', value: '/images/colors/yellow.svg', label: 'Yellow' },
    ],
  },
  // 5. SHAPES
  {
    id: 'f4p-5',
    targetWord: 'SHAPES',
    category: 'Math',
    images: [
      { type: 'image', value: '/images/shapes/circle.svg', label: 'Circle' },
      { type: 'image', value: '/images/shapes/square.svg', label: 'Square' },
      { type: 'image', value: '/images/shapes/triangle.svg', label: 'Triangle' },
      { type: 'image', value: '/images/shapes/star.svg', label: 'Star' },
    ],
  },
  // 6. FOOD
  {
    id: 'f4p-6',
    targetWord: 'FOOD',
    category: 'Life',
    images: [
      { type: 'image', value: '/images/food/bread.svg', label: 'Bread' },
      { type: 'image', value: '/images/food/milk.svg', label: 'Milk' },
      { type: 'image', value: '/images/food/pizza.svg', label: 'Pizza' },
      { type: 'image', value: '/images/food/egg.svg', label: 'Egg' },
    ],
  },
  // 7. OBJECTS
  {
    id: 'f4p-7',
    targetWord: 'OBJECTS',
    category: 'Everyday',
    images: [
      { type: 'image', value: '/images/objects/book.svg', label: 'Book' },
      { type: 'image', value: '/images/objects/chair.svg', label: 'Chair' },
      { type: 'image', value: '/images/objects/pencil.svg', label: 'Pencil' },
      { type: 'image', value: '/images/objects/clock.svg', label: 'Clock' },
    ],
  },
  // 8. SIGNS
  {
    id: 'f4p-8',
    targetWord: 'SIGNS',
    category: 'Safety',
    images: [
      { type: 'image', value: '/images/signs/sign_stop.svg', label: 'Stop Sign' },
      { type: 'image', value: '/images/signs/sign_hospital.svg', label: 'Hospital Sign' },
      { type: 'image', value: '/images/signs/sign_parking.svg', label: 'Parking Sign' },
      { type: 'image', value: '/images/signs/sign_stop.svg', label: 'Traffic Light' },
    ],
  },
  // 9. HEALTH
  {
    id: 'f4p-9',
    targetWord: 'HEALTH',
    category: 'Medical',
    images: [
      { type: 'emoji', value: '🩺', label: 'Stethoscope' },
      { type: 'emoji', value: '👨‍⚕️', label: 'Doctor' },
      { type: 'emoji', value: '🏥', label: 'Hospital' },
      { type: 'emoji', value: '💊', label: 'Medicine' },
    ],
  },
  // 10. SCHOOL
  {
    id: 'f4p-10',
    targetWord: 'SCHOOL',
    category: 'Education',
    images: [
      { type: 'emoji', value: '📚', label: 'Books' },
      { type: 'emoji', value: '✏️', label: 'Pencil' },
      { type: 'emoji', value: '🎒', label: 'School Bag' },
      { type: 'emoji', value: '🏫', label: 'Classroom' },
    ],
  },
  // 11. KITCHEN
  {
    id: 'f4p-11',
    targetWord: 'KITCHEN',
    category: 'Home',
    images: [
      { type: 'emoji', value: '🍽️', label: 'Plate' },
      { type: 'emoji', value: '🥄', label: 'Spoon' },
      { type: 'emoji', value: '🍴', label: 'Fork' },
      { type: 'emoji', value: '🥤', label: 'Cup' },
    ],
  },
  // 12. CLOTHES
  {
    id: 'f4p-12',
    targetWord: 'CLOTHES',
    category: 'Fashion',
    images: [
      { type: 'emoji', value: '👕', label: 'Shirt' },
      { type: 'emoji', value: '👖', label: 'Jeans' },
      { type: 'emoji', value: '👟', label: 'Shoes' },
      { type: 'emoji', value: '🧢', label: 'Cap' },
    ],
  },
  // 13. WEATHER
  {
    id: 'f4p-13',
    targetWord: 'WEATHER',
    category: 'Nature',
    images: [
      { type: 'emoji', value: '☀️', label: 'Sun' },
      { type: 'emoji', value: '🌧️', label: 'Rain' },
      { type: 'emoji', value: '❄️', label: 'Snow' },
      { type: 'emoji', value: '🌈', label: 'Rainbow' },
    ],
  },
  // 14. SPORTS
  {
    id: 'f4p-14',
    targetWord: 'SPORTS',
    category: 'Activity',
    images: [
      { type: 'emoji', value: '⚽', label: 'Football' },
      { type: 'emoji', value: '🏀', label: 'Basketball' },
      { type: 'emoji', value: '🎾', label: 'Tennis' },
      { type: 'emoji', value: '🏏', label: 'Cricket' },
    ],
  },
  // 15. TRAVEL
  {
    id: 'f4p-15',
    targetWord: 'TRAVEL',
    category: 'Journey',
    images: [
      { type: 'emoji', value: '✈️', label: 'Airplane' },
      { type: 'emoji', value: '🧳', label: 'Suitcase' },
      { type: 'emoji', value: '🗺️', label: 'Map' },
      { type: 'emoji', value: '🛂', label: 'Passport' },
    ],
  },
  // 16. TIME
  {
    id: 'f4p-16',
    targetWord: 'TIME',
    category: 'Clock',
    images: [
      { type: 'emoji', value: '⌚', label: 'Watch' },
      { type: 'emoji', value: '⏰', label: 'Alarm' },
      { type: 'emoji', value: '⏳', label: 'Hourglass' },
      { type: 'emoji', value: '📅', label: 'Calendar' },
    ],
  },
  // 17. MUSIC
  {
    id: 'f4p-17',
    targetWord: 'MUSIC',
    category: 'Sound',
    images: [
      { type: 'emoji', value: '🎸', label: 'Guitar' },
      { type: 'emoji', value: '🎹', label: 'Piano' },
      { type: 'emoji', value: '🥁', label: 'Drums' },
      { type: 'emoji', value: '🎙️', label: 'Microphone' },
    ],
  },
  // 18. PETS
  {
    id: 'f4p-18',
    targetWord: 'PETS',
    category: 'Animals',
    images: [
      { type: 'image', value: '/images/animals/dog.svg', label: 'Dog' },
      { type: 'image', value: '/images/animals/cat.svg', label: 'Cat' },
      { type: 'image', value: '/images/animals/rabbit.svg', label: 'Rabbit' },
      { type: 'image', value: '/images/birds/peacock.svg', label: 'Bird' },
    ],
  },
  // 19. VEGETABLES
  {
    id: 'f4p-19',
    targetWord: 'VEGGIES',
    category: 'Food',
    images: [
      { type: 'image', value: '/images/vegetables/carrot.svg', label: 'Carrot' },
      { type: 'image', value: '/images/vegetables/tomato.svg', label: 'Tomato' },
      { type: 'emoji', value: '🥦', label: 'Broccoli' },
      { type: 'emoji', value: '🌽', label: 'Corn' },
    ],
  },
  // 20. DRINKS
  {
    id: 'f4p-20',
    targetWord: 'DRINKS',
    category: 'Food',
    images: [
      { type: 'image', value: '/images/food/milk.svg', label: 'Milk' },
      { type: 'emoji', value: '🧃', label: 'Juice' },
      { type: 'emoji', value: '☕', label: 'Coffee' },
      { type: 'emoji', value: '🍵', label: 'Tea' },
    ],
  },
];

// Helper generator for 50+ total puzzles
const EXTENDED_PUZZLES: FourPicsPuzzle[] = [
  { id: 'f4p-21', targetWord: 'NATURE', category: 'Environment', images: [{ type: 'emoji', value: '🌲', label: 'Tree' }, { type: 'emoji', value: '🌸', label: 'Flower' }, { type: 'emoji', value: '⛰️', label: 'Mountain' }, { type: 'emoji', value: '🌊', label: 'River' }] },
  { id: 'f4p-22', targetWord: 'FAMILY', category: 'People', images: [{ type: 'emoji', value: '👨', label: 'Father' }, { type: 'emoji', value: '👩', label: 'Mother' }, { type: 'emoji', value: '👦', label: 'Son' }, { type: 'emoji', value: '👧', label: 'Daughter' }] },
  { id: 'f4p-23', targetWord: 'FARM', category: 'Place', images: [{ type: 'emoji', value: '🚜', label: 'Tractor' }, { type: 'emoji', value: '🐮', label: 'Cow' }, { type: 'emoji', value: '🐔', label: 'Chicken' }, { type: 'emoji', value: '🌾', label: 'Wheat' }] },
  { id: 'f4p-24', targetWord: 'OCEAN', category: 'Water', images: [{ type: 'emoji', value: '🐬', label: 'Dolphin' }, { type: 'emoji', value: '🐋', label: 'Whale' }, { type: 'emoji', value: '🦈', label: 'Shark' }, { type: 'emoji', value: '🐙', label: 'Octopus' }] },
  { id: 'f4p-25', targetWord: 'SPACE', category: 'Cosmos', images: [{ type: 'emoji', value: '🚀', label: 'Rocket' }, { type: 'emoji', value: '🪐', label: 'Planet' }, { type: 'emoji', value: '⭐', label: 'Star' }, { type: 'emoji', value: '🌙', label: 'Moon' }] },
  { id: 'f4p-26', targetWord: 'WORK', category: 'Jobs', images: [{ type: 'emoji', value: '💼', label: 'Briefcase' }, { type: 'emoji', value: '💻', label: 'Laptop' }, { type: 'emoji', value: '🖊️', label: 'Pen' }, { type: 'emoji', value: '📄', label: 'Document' }] },
  { id: 'f4p-27', targetWord: 'MONEY', category: 'Finance', images: [{ type: 'emoji', value: '💵', label: 'Banknote' }, { type: 'emoji', value: '🪙', label: 'Coin' }, { type: 'emoji', value: '💳', label: 'Card' }, { type: 'emoji', value: '🏦', label: 'Bank' }] },
  { id: 'f4p-28', targetWord: 'PARTY', category: 'Celebration', images: [{ type: 'emoji', value: '🎈', label: 'Balloon' }, { type: 'emoji', value: '🎂', label: 'Cake' }, { type: 'emoji', value: '🎁', label: 'Gift' }, { type: 'emoji', value: '🎉', label: 'Confetti' }] },
  { id: 'f4p-29', targetWord: 'BIRD', category: 'Wildlife', images: [{ type: 'image', value: '/images/birds/peacock.svg', label: 'Peacock' }, { type: 'emoji', value: '🦅', label: 'Eagle' }, { type: 'emoji', value: '🦆', label: 'Duck' }, { type: 'emoji', value: '🦉', label: 'Owl' }] },
  { id: 'f4p-30', targetWord: 'BAKERY', category: 'Food', images: [{ type: 'image', value: '/images/food/bread.svg', label: 'Bread' }, { type: 'emoji', value: '🥐', label: 'Croissant' }, { type: 'emoji', value: '🥖', label: 'Baguette' }, { type: 'emoji', value: '🍩', label: 'Donut' }] },
];

export const ALL_FOUR_PICS_PUZZLES = [...FOUR_PICS_PUZZLES, ...EXTENDED_PUZZLES];

export function FourPicsOneWordGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<'instructions' | 'playing' | 'completed'>('instructions');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placedLetters, setPlacedLetters] = useState<{ id: number; char: string }[]>([]);
  const [score, setScore] = useState(0);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);

  const activePuzzle = ALL_FOUR_PICS_PUZZLES[currentIndex];

  // Generate scrambled letter bank for current puzzle
  const letterBank = useMemo(() => {
    if (!activePuzzle) return [];
    const targetChars = activePuzzle.targetWord.split('');
    const decoys = ['A', 'E', 'I', 'O', 'U', 'R', 'S', 'T', 'L', 'N', 'P', 'M', 'B', 'C', 'D'];
    const extraNeeded = Math.max(12 - targetChars.length, 4);

    const randomDecoys = [];
    for (let i = 0; i < extraNeeded; i++) {
      randomDecoys.push(decoys[Math.floor(Math.random() * decoys.length)]);
    }

    return [...targetChars, ...randomDecoys].sort(() => Math.random() - 0.5);
  }, [currentIndex, activePuzzle]);

  const handleStart = () => {
    setCurrentIndex(0);
    setPlacedLetters([]);
    setRevealedIndices([]);
    setScore(0);
    setGameState('playing');
  };

  const handleSelectLetter = (char: string, bankIdx: number) => {
    if (placedLetters.length >= activePuzzle.targetWord.length) return;

    const newPlaced = [...placedLetters, { id: bankIdx, char }];
    setPlacedLetters(newPlaced);

    const formedWord = newPlaced.map((l) => l.char).join('');
    if (formedWord === activePuzzle.targetWord) {
      setScore((s) => s + 50);
    }
  };

  const handleRemoveLetter = (slotIndex: number) => {
    if (revealedIndices.includes(slotIndex)) return; // Locked hint letters cannot be removed
    setPlacedLetters(placedLetters.filter((_, i) => i !== slotIndex));
  };

  const handleNextPuzzle = () => {
    if (currentIndex < ALL_FOUR_PICS_PUZZLES.length - 1) {
      setCurrentIndex((c) => c + 1);
      setPlacedLetters([]);
      setRevealedIndices([]);
    } else {
      setGameState('completed');
    }
  };

  const handleSkipPuzzle = () => {
    handleNextPuzzle();
  };

  const handleHint = () => {
    // Reveal first unrevealed letter slot
    const targetWord = activePuzzle.targetWord;
    for (let i = 0; i < targetWord.length; i++) {
      if (!revealedIndices.includes(i)) {
        const correctChar = targetWord[i];
        const bankIdx = letterBank.findIndex((c, idx) => c === correctChar && !placedLetters.some((p) => p.id === idx));

        if (bankIdx >= 0) {
          const updatedPlaced = [...placedLetters];
          updatedPlaced[i] = { id: bankIdx, char: correctChar };
          setPlacedLetters(updatedPlaced);
          setRevealedIndices([...revealedIndices, i]);
        }
        break;
      }
    }
  };

  const currentFormedWord = placedLetters.map((l) => l?.char || '').join('');
  const isCorrect = currentFormedWord === activePuzzle?.targetWord;
  const progressPercent = Math.round(((currentIndex + 1) / ALL_FOUR_PICS_PUZZLES.length) * 100);

  return (
    <GameContainer title="4 Pics 1 Word" progress={progressPercent} onExit={onExit} score={score}>
      {gameState === 'instructions' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-6 animate-in fade-in">
          <div className="h-20 w-20 rounded-3xl bg-pink-500/10 flex items-center justify-center text-pink-600 text-4xl shadow-inner">
            📷
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">4 Pics 1 Word</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Look at 4 DIFFERENT pictures that share ONE common connecting word. Form the word using the letter bank!
            </p>
          </div>

          <div className="flex gap-3 w-full">
            <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={handleStart}>
              Start Puzzles 🚀
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-2xl" onClick={onExit}>
              Exit
            </Button>
          </div>
        </div>
      )}

      {gameState === 'playing' && activePuzzle && (
        <div className="flex flex-col items-center w-full max-w-md space-y-5 animate-in fade-in">
          <div className="flex justify-between w-full text-xs font-extrabold text-muted-foreground">
            <span>Puzzle #{currentIndex + 1} of {ALL_FOUR_PICS_PUZZLES.length}</span>
            <span className="text-primary">{activePuzzle.category}</span>
          </div>

          {/* 4 DISTINCT IMAGES GRID */}
          <div className="grid grid-cols-2 gap-3 w-full bg-card p-3 rounded-3xl border-2 border-primary/20 shadow-md">
            {activePuzzle.images.map((img, i) => (
              <div
                key={i}
                className="h-28 bg-white dark:bg-card border-2 border-border/80 rounded-2xl p-2 flex flex-col items-center justify-center shadow-inner relative group"
              >
                {img.type === 'image' ? (
                  <img src={img.value} alt={img.label} className="w-16 h-16 object-contain drop-shadow" />
                ) : (
                  <span className="text-5xl drop-shadow">{img.value}</span>
                )}
                <span className="text-[10px] font-extrabold text-muted-foreground mt-1 truncate max-w-full">
                  {img.label}
                </span>
              </div>
            ))}
          </div>

          {/* FORMED ANSWER SLOTS */}
          <div className="flex gap-2 justify-center py-1 flex-wrap">
            {Array.from({ length: activePuzzle.targetWord.length }).map((_, i) => {
              const placed = placedLetters[i];
              const isHinted = revealedIndices.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => handleRemoveLetter(i)}
                  className={`w-11 h-13 rounded-2xl border-3 font-black text-xl shadow-sm flex items-center justify-center transition-all ${
                    isHinted
                      ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      : placed
                      ? 'border-primary bg-primary/10 text-primary scale-105'
                      : 'border-border/80 bg-card text-muted-foreground'
                  }`}
                >
                  {placed ? placed.char : ''}
                </button>
              );
            })}
          </div>

          {/* SUCCESS BANNER OR CONTROLS */}
          {isCorrect ? (
            <div className="w-full space-y-3 animate-in zoom-in-95">
              <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 text-center font-black text-base flex items-center justify-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" /> Correct! Answer is {activePuzzle.targetWord} (+50 XP)
              </div>
              <Button size="lg" className="w-full h-13 rounded-2xl font-extrabold text-base shadow-lg" onClick={handleNextPuzzle}>
                Next Puzzle →
              </Button>
            </div>
          ) : (
            <>
              {/* ACTION BAR: Hint, Skip */}
              <div className="flex gap-2 w-full justify-between">
                <Button size="sm" variant="outline" onClick={handleHint} className="rounded-xl gap-1 font-bold text-xs border-amber-500/40 text-amber-600">
                  <Lightbulb className="h-4 w-4" /> Reveal Hint
                </Button>
                <Button size="sm" variant="ghost" onClick={handleSkipPuzzle} className="rounded-xl gap-1 font-bold text-xs text-muted-foreground">
                  <SkipForward className="h-4 w-4" /> Skip Puzzle
                </Button>
              </div>

              {/* LETTER BANK */}
              <div className="grid grid-cols-6 gap-2 w-full pt-1">
                {letterBank.map((char, bankIdx) => {
                  const isUsed = placedLetters.some((l) => l?.id === bankIdx);
                  return (
                    <button
                      key={bankIdx}
                      onClick={() => handleSelectLetter(char, bankIdx)}
                      disabled={isUsed}
                      className={`h-11 rounded-xl font-black text-lg border-2 transition-all shadow-sm ${
                        isUsed
                          ? 'opacity-25 bg-muted border-border cursor-not-allowed'
                          : 'border-border bg-secondary text-secondary-foreground hover:border-primary hover:bg-primary/10 hover:scale-105'
                      }`}
                    >
                      {char}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {gameState === 'completed' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-8 animate-in slide-in-from-bottom-8">
          <div className="text-7xl animate-bounce">🏆</div>
          <h2 className="text-3xl font-extrabold">4 Pics 1 Word Grand Master!</h2>
          <Card className="p-6 w-full rounded-3xl border-primary/20 bg-primary/5 space-y-2">
            <div className="text-xs font-bold uppercase text-muted-foreground">Total XP Earned</div>
            <div className="text-4xl font-black text-primary">+{score} XP</div>
          </Card>
          <div className="flex gap-3 w-full">
            <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold gap-2 shadow-lg" onClick={handleStart}>
              <RefreshCw className="h-5 w-5" /> Play Again
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-2xl gap-2" onClick={onExit}>
              <ArrowLeft className="h-5 w-5" /> Back to Games
            </Button>
          </div>
        </div>
      )}
    </GameContainer>
  );
}
