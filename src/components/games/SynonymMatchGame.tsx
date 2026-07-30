import React, { useState } from 'react';
import { GameContainer } from './GameContainer';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { RefreshCw, ArrowLeft, Sparkles, Check } from 'lucide-react';

export const SYNONYM_PAIRS = [
  { id: 'syn-1', word: 'Large', synonym: 'Big' },
  { id: 'syn-2', word: 'Tiny', synonym: 'Small' },
  { id: 'syn-3', word: 'Quick', synonym: 'Fast' },
  { id: 'syn-4', word: 'Glad', synonym: 'Happy' },
  { id: 'syn-5', word: 'Start', synonym: 'Begin' },
];

export function SynonymMatchGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<'instructions' | 'playing' | 'completed'>('instructions');
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);

  const [shuffledSynonyms] = useState(() => {
    return [...SYNONYM_PAIRS].map((p) => p.synonym).sort(() => Math.random() - 0.5);
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

  const handleSynonymTap = (syn: string) => {
    if (selectedWordId) {
      const pair = SYNONYM_PAIRS.find((p) => p.id === selectedWordId);
      if (pair && pair.synonym === syn) {
        const updated = { ...matches, [selectedWordId]: syn };
        setMatches(updated);
        setScore((s) => s + 20);
        setSelectedWordId(null);

        if (Object.keys(updated).length === SYNONYM_PAIRS.length) {
          setTimeout(() => setGameState('completed'), 500);
        }
      } else {
        setSelectedWordId(null);
      }
    }
  };

  const progressPercent = Math.round((Object.keys(matches).length / SYNONYM_PAIRS.length) * 100);

  return (
    <GameContainer title="Synonym Match" progress={progressPercent} onExit={onExit} score={score}>
      {gameState === 'instructions' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-6 animate-in fade-in">
          <div className="h-20 w-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-600 text-4xl shadow-inner">
            ✨
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Synonym Match</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Match words with similar meanings (e.g. Large ↔ Big, Quick ↔ Fast)!
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
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase text-muted-foreground block text-center">Word</span>
              {SYNONYM_PAIRS.map((item) => {
                const isSelected = selectedWordId === item.id;
                const isMatched = !!matches[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => handleWordTap(item.id)}
                    disabled={isMatched}
                    className={`w-full p-4 rounded-2xl border-4 text-left font-black text-lg transition-all shadow-md flex items-center justify-between ${
                      isMatched
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : isSelected
                        ? 'border-primary bg-primary/10 scale-105 shadow-xl ring-4 ring-primary/20'
                        : 'border-border/80 bg-card hover:border-primary/50 text-foreground'
                    }`}
                  >
                    <span>{item.word}</span>
                    {isMatched && <Check className="h-5 w-5 text-amber-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase text-muted-foreground block text-center">Synonym</span>
              {shuffledSynonyms.map((syn, idx) => {
                const isMatched = Object.values(matches).includes(syn);
                return (
                  <button
                    key={idx}
                    onClick={() => handleSynonymTap(syn)}
                    disabled={isMatched}
                    className={`w-full p-4 rounded-2xl border-4 text-left font-black text-lg transition-all shadow-md flex items-center justify-between ${
                      isMatched
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : selectedWordId
                        ? 'border-primary/40 bg-primary/5 hover:border-primary hover:scale-105 cursor-pointer'
                        : 'border-border/80 bg-card text-foreground'
                    }`}
                  >
                    <span>{syn}</span>
                    {isMatched && <Check className="h-5 w-5 text-amber-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {gameState === 'completed' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-8 animate-in slide-in-from-bottom-8">
          <div className="text-7xl animate-bounce">🎉</div>
          <h2 className="text-3xl font-extrabold">Synonym Match Complete!</h2>
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
