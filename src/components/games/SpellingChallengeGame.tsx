import React, { useState } from 'react';
import { GameContainer } from './GameContainer';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { RefreshCw, ArrowLeft, Volume2, CheckCircle2, XCircle } from 'lucide-react';

export interface SpellingChallengeItem {
  id: string;
  targetWord: string;
  image: string;
}

export const SPELLING_ITEMS: SpellingChallengeItem[] = [
  { id: 'sp-1', targetWord: 'APPLE', image: '/images/fruits/apple.svg' },
  { id: 'sp-2', targetWord: 'BANANA', image: '/images/fruits/banana.svg' },
  { id: 'sp-3', targetWord: 'CAR', image: '/images/vehicles/car.svg' },
];

export function SpellingChallengeGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<'instructions' | 'playing' | 'completed'>('instructions');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [score, setScore] = useState(0);

  const activeItem = SPELLING_ITEMS[currentIndex];

  const handleStart = () => {
    setCurrentIndex(0);
    setInputVal('');
    setFeedback('idle');
    setScore(0);
    setGameState('playing');
  };

  const playTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim().toUpperCase() === activeItem.targetWord) {
      setFeedback('correct');
      setScore((s) => s + 30);
      setTimeout(() => {
        setFeedback('idle');
        setInputVal('');
        if (currentIndex < SPELLING_ITEMS.length - 1) {
          setCurrentIndex((c) => c + 1);
        } else {
          setGameState('completed');
        }
      }, 700);
    } else {
      setFeedback('wrong');
    }
  };

  const progressPercent = Math.round(((currentIndex + 1) / SPELLING_ITEMS.length) * 100);

  return (
    <GameContainer title="Spelling Challenge" progress={progressPercent} onExit={onExit} score={score}>
      {gameState === 'instructions' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-6 animate-in fade-in">
          <div className="h-20 w-20 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-600 text-4xl shadow-inner">
            🔤
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Spelling Challenge</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Listen to the word or look at the picture, then type the correct English spelling!
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={handleStart}>
              Start Challenge 🚀
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-2xl" onClick={onExit}>
              Exit
            </Button>
          </div>
        </div>
      )}

      {gameState === 'playing' && activeItem && (
        <div className="flex flex-col items-center w-full max-w-md space-y-6 animate-in fade-in">
          <Card className="p-6 rounded-3xl border-2 border-primary/20 bg-card shadow-lg flex flex-col items-center space-y-4 w-full">
            <img src={activeItem.image} alt="Spelling clue" className="w-28 h-28 object-contain drop-shadow" />

            <Button
              size="sm"
              variant="outline"
              onClick={() => playTTS(activeItem.targetWord)}
              className="rounded-xl font-bold gap-2 text-primary border-primary/30"
            >
              <Volume2 className="h-4 w-4" /> Hear Word Audio
            </Button>
          </Card>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <Input
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                if (feedback !== 'idle') setFeedback('idle');
              }}
              placeholder="Type spelling here..."
              className="h-14 rounded-2xl text-center font-black text-2xl tracking-widest uppercase border-2 border-primary/30 shadow-sm"
              autoFocus
            />

            {feedback === 'correct' && (
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-extrabold text-sm">
                <CheckCircle2 className="h-5 w-5" /> Correct Spelling! +30 XP
              </div>
            )}

            {feedback === 'wrong' && (
              <div className="flex items-center justify-center gap-2 text-red-500 font-extrabold text-sm">
                <XCircle className="h-5 w-5" /> Try again!
              </div>
            )}

            <Button type="submit" size="lg" className="w-full h-14 rounded-2xl font-bold text-lg shadow-md">
              Submit Answer
            </Button>
          </form>
        </div>
      )}

      {gameState === 'completed' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-8 animate-in slide-in-from-bottom-8">
          <div className="text-7xl animate-bounce">🔤</div>
          <h2 className="text-3xl font-extrabold">Spelling Challenge Complete!</h2>
          <Card className="p-6 w-full rounded-3xl border-primary/20 bg-primary/5 space-y-2">
            <div className="text-xs font-bold uppercase text-muted-foreground">Total XP</div>
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
