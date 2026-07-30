import React, { useState } from 'react';
import { GameContainer } from './GameContainer';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { RefreshCw, ArrowLeft, BookOpen, Sparkles, Check } from 'lucide-react';

export interface WordMeaningPair {
  id: string;
  word: string;
  meaning: string;
}

export const WORD_MEANING_PAIRS: WordMeaningPair[] = [
  { id: 'wm-1', word: 'Generous', meaning: 'Happy to share and give to others' },
  { id: 'wm-2', word: 'Ancient', meaning: 'Belonging to the very distant past' },
  { id: 'wm-3', word: 'Fragile', meaning: 'Easily broken or damaged' },
  { id: 'wm-4', word: 'Courage', meaning: 'Bravery when facing difficulty' },
  { id: 'wm-5', word: 'Patient', meaning: 'Able to wait calmly without anger' },
];

export function WordMatchGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<'instructions' | 'playing' | 'completed'>('instructions');
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({}); // { [wordId]: meaning }
  const [score, setScore] = useState(0);

  const [shuffledMeanings] = useState(() => {
    return [...WORD_MEANING_PAIRS].map((p) => p.meaning).sort(() => Math.random() - 0.5);
  });

  const handleStart = () => {
    setMatches({});
    setSelectedWordId(null);
    setScore(0);
    setGameState('playing');
  };

  const handleWordTap = (id: string) => {
    setSelectedWordId(id === selectedWordId ? null : id);
  };

  const handleMeaningTap = (meaning: string) => {
    if (selectedWordId) {
      const activePair = WORD_MEANING_PAIRS.find((p) => p.id === selectedWordId);
      if (activePair && activePair.meaning === meaning) {
        const updated = { ...matches, [selectedWordId]: meaning };
        setMatches(updated);
        setScore((s) => s + 20);
        setSelectedWordId(null);

        if (Object.keys(updated).length === WORD_MEANING_PAIRS.length) {
          setTimeout(() => setGameState('completed'), 500);
        }
      } else {
        setSelectedWordId(null);
      }
    }
  };

  const progressPercent = Math.round((Object.keys(matches).length / WORD_MEANING_PAIRS.length) * 100);

  return (
    <GameContainer title="Word Match" progress={progressPercent} onExit={onExit} score={score}>
      {gameState === 'instructions' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-6 animate-in fade-in">
          <div className="h-20 w-20 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-600 text-4xl shadow-inner">
            📖
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Word Match</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Match English words on the left with their correct definitions on the right!
            </p>
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

      {gameState === 'playing' && (
        <div className="flex flex-col items-center w-full max-w-xl space-y-6 animate-in fade-in">
          <div className="flex justify-between w-full text-xs font-bold text-muted-foreground">
            <span>Tap Word $\rightarrow$ Tap Meaning</span>
            <span className="text-emerald-600">{Object.keys(matches).length} / {WORD_MEANING_PAIRS.length} Matched</span>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            {/* WORDS */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase text-muted-foreground block text-center">Words</span>
              {WORD_MEANING_PAIRS.map((item) => {
                const isSelected = selectedWordId === item.id;
                const isMatched = !!matches[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => handleWordTap(item.id)}
                    disabled={isMatched}
                    className={`w-full p-4 rounded-2xl border-4 text-left font-black text-base transition-all shadow-md flex items-center justify-between ${
                      isMatched
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : isSelected
                        ? 'border-primary bg-primary/10 scale-105 shadow-xl ring-4 ring-primary/20'
                        : 'border-border/80 bg-card hover:border-primary/50 text-foreground'
                    }`}
                  >
                    <span>{item.word}</span>
                    {isMatched && <Check className="h-5 w-5 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* MEANINGS */}
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase text-muted-foreground block text-center">Definitions</span>
              {shuffledMeanings.map((meaning, idx) => {
                const isMatched = Object.values(matches).includes(meaning);
                return (
                  <button
                    key={idx}
                    onClick={() => handleMeaningTap(meaning)}
                    disabled={isMatched}
                    className={`w-full p-4 rounded-2xl border-4 text-left font-semibold text-xs leading-snug transition-all shadow-md flex items-center justify-between min-h-[58px] ${
                      isMatched
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : selectedWordId
                        ? 'border-primary/40 bg-primary/5 hover:border-primary hover:scale-102 cursor-pointer'
                        : 'border-border/80 bg-card text-foreground'
                    }`}
                  >
                    <span>{meaning}</span>
                    {isMatched && <Check className="h-5 w-5 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {gameState === 'completed' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-8 animate-in slide-in-from-bottom-8">
          <div className="text-7xl animate-bounce">🌟</div>
          <h2 className="text-3xl font-extrabold">Word Match Complete!</h2>
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
