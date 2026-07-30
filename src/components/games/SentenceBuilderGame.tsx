import React, { useState } from 'react';
import { GameContainer } from './GameContainer';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { RefreshCw, ArrowLeft, Volume2, Sparkles, Check } from 'lucide-react';

export interface SentenceChallenge {
  id: string;
  targetSentence: string;
  wordChips: string[];
}

export const SENTENCE_CHALLENGES: SentenceChallenge[] = [
  {
    id: 'sc-1',
    targetSentence: 'This is a red apple',
    wordChips: ['apple', 'This', 'red', 'is', 'a'],
  },
  {
    id: 'sc-2',
    targetSentence: 'The dog is running fast',
    wordChips: ['is', 'dog', 'fast', 'The', 'running'],
  },
];

export function SentenceBuilderGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<'instructions' | 'playing' | 'completed'>('instructions');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [assembledWords, setAssembledWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  const activeChallenge = SENTENCE_CHALLENGES[currentIndex];

  const handleStart = () => {
    setCurrentIndex(0);
    setAssembledWords([]);
    setScore(0);
    setGameState('playing');
  };

  const handleAddWord = (word: string) => {
    const updated = [...assembledWords, word];
    setAssembledWords(updated);

    const currentSentence = updated.join(' ');
    if (currentSentence === activeChallenge.targetSentence) {
      setScore((s) => s + 40);
      if (currentIndex < SENTENCE_CHALLENGES.length - 1) {
        setTimeout(() => {
          setCurrentIndex((c) => c + 1);
          setAssembledWords([]);
        }, 600);
      } else {
        setTimeout(() => setGameState('completed'), 600);
      }
    }
  };

  const handleRemoveWord = (index: number) => {
    setAssembledWords(assembledWords.filter((_, i) => i !== index));
  };

  const playTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const progressPercent = Math.round(((currentIndex + 1) / SENTENCE_CHALLENGES.length) * 100);

  return (
    <GameContainer title="Sentence Builder" progress={progressPercent} onExit={onExit} score={score}>
      {gameState === 'instructions' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-6 animate-in fade-in">
          <div className="h-20 w-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 text-4xl shadow-inner">
            ✍️
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Sentence Builder</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Arrange mixed-up word chips into complete, grammatically correct sentences!
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={handleStart}>
              Start Building 🚀
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-2xl" onClick={onExit}>
              Exit
            </Button>
          </div>
        </div>
      )}

      {gameState === 'playing' && activeChallenge && (
        <div className="flex flex-col items-center w-full max-w-md space-y-6 animate-in fade-in">
          {/* Target Prompt Audio */}
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              onClick={() => playTTS(activeChallenge.targetSentence)}
              className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border-primary/20"
            >
              <Volume2 className="h-6 w-6" />
            </Button>
            <span className="text-sm font-semibold text-muted-foreground">Listen to Target Sentence</span>
          </div>

          {/* Assembled Sentence Drop Zone */}
          <Card className="w-full p-6 min-h-[90px] rounded-3xl border-2 border-primary/30 bg-card shadow-inner flex flex-wrap gap-2 items-center">
            {assembledWords.length === 0 && (
              <span className="text-xs text-muted-foreground italic mx-auto">Tap word chips below to build sentence...</span>
            )}
            {assembledWords.map((word, idx) => (
              <button
                key={idx}
                onClick={() => handleRemoveWord(idx)}
                className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow hover:opacity-90 animate-in zoom-in-95"
              >
                {word}
              </button>
            ))}
          </Card>

          {/* Word Chips Bank */}
          <div className="flex flex-wrap gap-3 justify-center w-full pt-2">
            {activeChallenge.wordChips.map((word, idx) => {
              const isUsed = assembledWords.includes(word);
              return (
                <button
                  key={idx}
                  onClick={() => handleAddWord(word)}
                  disabled={isUsed}
                  className={`px-5 py-3 rounded-2xl font-black text-lg border-2 transition-all shadow-md ${
                    isUsed
                      ? 'opacity-30 bg-muted border-border cursor-not-allowed'
                      : 'bg-secondary border-border text-foreground hover:border-primary hover:scale-105'
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState === 'completed' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-8 animate-in slide-in-from-bottom-8">
          <div className="text-7xl animate-bounce">✍️</div>
          <h2 className="text-3xl font-extrabold">Sentence Builder Mastered!</h2>
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
