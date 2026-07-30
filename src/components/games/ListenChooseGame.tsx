import React, { useState } from 'react';
import { GameContainer } from './GameContainer';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { RefreshCw, ArrowLeft, Volume2, CheckCircle2 } from 'lucide-react';

export interface ListenChooseChallenge {
  id: string;
  audioPrompt: string;
  correctWord: string;
  options: { word: string; image: string }[];
}

export const LISTEN_CHALLENGES: ListenChooseChallenge[] = [
  {
    id: 'lc-1',
    audioPrompt: 'Apple',
    correctWord: 'Apple',
    options: [
      { word: 'Apple', image: '/images/fruits/apple.svg' },
      { word: 'Banana', image: '/images/fruits/banana.svg' },
      { word: 'Orange', image: '/images/fruits/orange.svg' },
      { word: 'Mango', image: '/images/fruits/mango.svg' },
    ],
  },
  {
    id: 'lc-2',
    audioPrompt: 'Car',
    correctWord: 'Car',
    options: [
      { word: 'Dog', image: '/images/animals/dog.svg' },
      { word: 'Car', image: '/images/vehicles/car.svg' },
      { word: 'Bus', image: '/images/vehicles/bus.svg' },
      { word: 'Bicycle', image: '/images/vehicles/bicycle.svg' },
    ],
  },
];

export function ListenChooseGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<'instructions' | 'playing' | 'completed'>('instructions');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const activeItem = LISTEN_CHALLENGES[currentIndex];

  const handleStart = () => {
    setCurrentIndex(0);
    setSelectedWord(null);
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

  const handleOptionTap = (word: string) => {
    setSelectedWord(word);
    if (word === activeItem.correctWord) {
      setScore((s) => s + 25);
      setTimeout(() => {
        setSelectedWord(null);
        if (currentIndex < LISTEN_CHALLENGES.length - 1) {
          setCurrentIndex((c) => c + 1);
        } else {
          setGameState('completed');
        }
      }, 600);
    }
  };

  const progressPercent = Math.round(((currentIndex + 1) / LISTEN_CHALLENGES.length) * 100);

  return (
    <GameContainer title="Listen and Choose" progress={progressPercent} onExit={onExit} score={score}>
      {gameState === 'instructions' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-6 animate-in fade-in">
          <div className="h-20 w-20 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-600 text-4xl shadow-inner">
            🎧
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Listen and Choose</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Tap the audio player soundboard to listen to the word, then pick the correct image!
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={handleStart}>
              Start Audio Game 🚀
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-2xl" onClick={onExit}>
              Exit
            </Button>
          </div>
        </div>
      )}

      {gameState === 'playing' && activeItem && (
        <div className="flex flex-col items-center w-full max-w-md space-y-6 animate-in fade-in">
          {/* Animated Audio Soundboard Player */}
          <button
            onClick={() => playTTS(activeItem.audioPrompt)}
            className="w-full p-8 rounded-3xl bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white flex flex-col items-center justify-center space-y-3 shadow-xl hover:scale-102 transition-all active:scale-95"
          >
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
              <Volume2 className="h-10 w-10 text-white animate-pulse" />
            </div>
            <span className="font-extrabold text-lg">Tap to Hear Word 🔊</span>
          </button>

          {/* 4 Image Choices Grid */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {activeItem.options.map((opt) => {
              const isSelected = selectedWord === opt.word;
              const isCorrect = opt.word === activeItem.correctWord;

              return (
                <button
                  key={opt.word}
                  onClick={() => handleOptionTap(opt.word)}
                  className={`p-4 rounded-3xl border-3 flex flex-col items-center space-y-2 transition-all shadow-md ${
                    isSelected && isCorrect
                      ? 'border-emerald-500 bg-emerald-500/10 scale-105 shadow-xl'
                      : isSelected && !isCorrect
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <img src={opt.image} alt={opt.word} className="w-20 h-20 object-contain drop-shadow" />
                  <span className="font-black text-sm text-foreground">{opt.word}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState === 'completed' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-8 animate-in slide-in-from-bottom-8">
          <div className="text-7xl animate-bounce">🎧</div>
          <h2 className="text-3xl font-extrabold">Listening Mastered!</h2>
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
