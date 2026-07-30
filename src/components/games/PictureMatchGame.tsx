import React, { useState, useEffect } from 'react';
import { GameContainer } from './GameContainer';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle2, XCircle, RefreshCw, ArrowLeft, HelpCircle, Volume2, Sparkles } from 'lucide-react';

export interface PictureMatchItem {
  id: string;
  word: string;
  image: string;
  category: 'fruits' | 'animals' | 'vehicles' | 'objects' | 'colors';
}

export const PICTURE_MATCH_ITEMS: PictureMatchItem[] = [
  // Fruits
  { id: 'apple', word: 'Apple', image: '/images/fruits/apple.svg', category: 'fruits' },
  { id: 'banana', word: 'Banana', image: '/images/fruits/banana.svg', category: 'fruits' },
  { id: 'mango', word: 'Mango', image: '/images/fruits/mango.svg', category: 'fruits' },
  { id: 'orange', word: 'Orange', image: '/images/fruits/orange.svg', category: 'fruits' },
  { id: 'grapes', word: 'Grapes', image: '/images/fruits/grapes.svg', category: 'fruits' },

  // Animals
  { id: 'dog', word: 'Dog', image: '/images/animals/dog.svg', category: 'animals' },
  { id: 'cat', word: 'Cat', image: '/images/animals/cat.svg', category: 'animals' },
  { id: 'lion', word: 'Lion', image: '/images/animals/lion.svg', category: 'animals' },
  { id: 'elephant', word: 'Elephant', image: '/images/animals/elephant.svg', category: 'animals' },
  { id: 'rabbit', word: 'Rabbit', image: '/images/animals/rabbit.svg', category: 'animals' },

  // Vehicles
  { id: 'car', word: 'Car', image: '/images/vehicles/car.svg', category: 'vehicles' },
  { id: 'bus', word: 'Bus', image: '/images/vehicles/bus.svg', category: 'vehicles' },
  { id: 'bicycle', word: 'Bicycle', image: '/images/vehicles/bicycle.svg', category: 'vehicles' },
  { id: 'train', word: 'Train', image: '/images/vehicles/train.svg', category: 'vehicles' },
  { id: 'airplane', word: 'Airplane', image: '/images/vehicles/airplane.svg', category: 'vehicles' },

  // Objects
  { id: 'book', word: 'Book', image: '/images/objects/book.svg', category: 'objects' },
  { id: 'chair', word: 'Chair', image: '/images/objects/chair.svg', category: 'objects' },
  { id: 'pencil', word: 'Pencil', image: '/images/objects/pencil.svg', category: 'objects' },
  { id: 'clock', word: 'Clock', image: '/images/objects/clock.svg', category: 'objects' },
  { id: 'phone', word: 'Phone', image: '/images/objects/phone.svg', category: 'objects' },

  // Colors
  { id: 'red', word: 'Red', image: '/images/colors/red.svg', category: 'colors' },
  { id: 'blue', word: 'Blue', image: '/images/colors/blue.svg', category: 'colors' },
  { id: 'green', word: 'Green', image: '/images/colors/green.svg', category: 'colors' },
  { id: 'yellow', word: 'Yellow', image: '/images/colors/yellow.svg', category: 'colors' },
  { id: 'purple', word: 'Purple', image: '/images/colors/purple.svg', category: 'colors' },
];

interface OptionChoice {
  id: string;
  word: string;
  isCorrect: boolean;
}

export function PictureMatchGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<'instructions' | 'playing' | 'completed'>('instructions');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deck, setDeck] = useState<PictureMatchItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<OptionChoice[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const initializeGame = (cat: string = 'all') => {
    let items = PICTURE_MATCH_ITEMS;
    if (cat !== 'all') {
      items = PICTURE_MATCH_ITEMS.filter((item) => item.category === cat);
    }
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOptionId(null);
    setIsCorrect(null);
  };

  const handleStart = () => {
    initializeGame(selectedCategory);
    setGameState('playing');
  };

  const handleRestart = () => {
    initializeGame(selectedCategory);
    setGameState('playing');
  };

  // Generate 3 options for current item
  useEffect(() => {
    if (deck.length > 0 && currentIndex < deck.length) {
      const active = deck[currentIndex];
      const distractors = PICTURE_MATCH_ITEMS
        .filter((i) => i.id !== active.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

      const choices: OptionChoice[] = [
        { id: active.id, word: active.word, isCorrect: true },
        { id: distractors[0].id, word: distractors[0].word, isCorrect: false },
        { id: distractors[1].id, word: distractors[1].word, isCorrect: false },
      ].sort(() => Math.random() - 0.5);

      setOptions(choices);
      setSelectedOptionId(null);
      setIsCorrect(null);
    }
  }, [deck, currentIndex]);

  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectOption = (opt: OptionChoice) => {
    if (selectedOptionId !== null) return;

    setSelectedOptionId(opt.id);
    setIsCorrect(opt.isCorrect);

    speakWord(opt.word);

    if (opt.isCorrect) {
      setScore((s) => s + 10);
    }
  };

  const handleNextPrompt = () => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((c) => c + 1);
    } else {
      setGameState('completed');
    }
  };

  const activePrompt = deck[currentIndex];
  const progressPercent = deck.length > 0 ? Math.round(((currentIndex + 1) / deck.length) * 100) : 0;

  return (
    <GameContainer
      title="Picture Match"
      progress={gameState === 'playing' ? progressPercent : gameState === 'completed' ? 100 : 0}
      onExit={onExit}
      score={score}
    >
      {gameState === 'instructions' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-300 py-6">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-4xl shadow-inner">
            🖼️
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Picture Match</h2>
            <p className="text-muted-foreground mt-2 text-balance leading-relaxed">
              Observe real images and select the matching English word! Select a category below or play all.
            </p>
          </div>

          {/* Category Selection */}
          <div className="w-full space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block text-left">
              Select Category:
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'fruits', 'animals', 'vehicles', 'objects', 'colors'].map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="capitalize rounded-xl font-bold text-xs"
                >
                  {cat === 'all' ? 'All Items (25)' : cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-muted/40 p-4 rounded-2xl border text-left text-xs text-muted-foreground space-y-2 w-full">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span>How to Play:</span>
            </div>
            <p>1. View the real picture card displayed on the screen.</p>
            <p>2. Tap the correct English word option.</p>
            <p>3. Earn <strong>+10 XP</strong> per correct match with speech audio!</p>
          </div>

          <div className="flex gap-3 w-full">
            <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={handleStart}>
              Start Match 🚀
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-2xl" onClick={onExit}>
              Exit
            </Button>
          </div>
        </div>
      )}

      {gameState === 'playing' && activePrompt && (
        <div className="flex flex-col items-center w-full max-w-md space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between w-full text-sm font-semibold text-muted-foreground">
            <span>Item {currentIndex + 1} of {deck.length}</span>
            <Badge variant="outline" className="capitalize text-xs font-bold text-primary">
              {activePrompt.category}
            </Badge>
          </div>

          {/* Real SVG Image Display Card */}
          <Card className="w-64 h-64 sm:w-72 sm:h-72 bg-white dark:bg-card border-4 border-primary/20 rounded-3xl shadow-md flex items-center justify-center p-6 relative overflow-hidden">
            <img
              src={activePrompt.image}
              alt={activePrompt.word}
              className="w-full h-full object-contain drop-shadow-md animate-in zoom-in-75 duration-300"
            />
          </Card>

          {/* 3 Option Choices */}
          <div className="grid grid-cols-1 gap-3 w-full">
            {options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;

              let btnVariantClass = 'bg-card border-border/80 text-foreground hover:border-primary/50 hover:bg-primary/5';
              if (isSelected) {
                if (opt.isCorrect) {
                  btnVariantClass = 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                } else {
                  btnVariantClass = 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold';
                }
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt)}
                  disabled={selectedOptionId !== null}
                  className={`w-full p-4 rounded-2xl border-2 font-bold text-lg text-center transition-all flex items-center justify-between shadow-sm ${btnVariantClass}`}
                >
                  <span className="flex-1 text-center">{opt.word}</span>
                  {isSelected && (
                    <span>
                      {opt.isCorrect ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <XCircle className="h-6 w-6 text-rose-600" />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Continue Button */}
          {selectedOptionId !== null && (
            <div className="flex flex-col items-center space-y-3 w-full animate-in slide-in-from-bottom-2 duration-200">
              {isCorrect ? (
                <div className="text-emerald-600 font-bold flex items-center gap-1.5 text-base">
                  <CheckCircle2 className="h-5 w-5" /> Correct Match! +10 XP
                </div>
              ) : (
                <div className="text-rose-600 font-bold flex items-center gap-1.5 text-base">
                  <XCircle className="h-5 w-5" /> Correct answer: {activePrompt.word}
                </div>
              )}
              <Button size="lg" className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={handleNextPrompt}>
                Continue →
              </Button>
            </div>
          )}
        </div>
      )}

      {gameState === 'completed' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 animate-in slide-in-from-bottom-8 duration-300 py-8">
          <span className="text-7xl animate-pulse">🌟</span>
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold">Picture Match Complete!</h2>
            <p className="text-muted-foreground text-sm">Great job matching all real category images!</p>
          </div>

          <Card className="p-6 w-full rounded-3xl border-primary/20 bg-primary/5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total XP Earned</div>
            <div className="text-4xl font-black text-primary">+{score} XP</div>
            <p className="text-xs text-muted-foreground">Matched {deck.length} picture items</p>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold gap-2 shadow-lg" onClick={handleRestart}>
              <RefreshCw className="h-5 w-5" />
              Play Again
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
