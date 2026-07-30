import React, { useState } from 'react';
import { GameContainer } from './GameContainer';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { RefreshCw, ArrowLeft, Search, Check } from 'lucide-react';

export const WORD_SEARCH_WORDS = ['APPLE', 'BANANA', 'MANGO', 'DOG', 'CAT'];

// 6x6 Letter Grid
const GRID = [
  ['A', 'P', 'P', 'L', 'E', 'X'],
  ['B', 'A', 'N', 'A', 'N', 'A'],
  ['M', 'A', 'N', 'G', 'O', 'Y'],
  ['D', 'O', 'G', 'Z', 'W', 'V'],
  ['C', 'A', 'T', 'K', 'Q', 'R'],
  ['F', 'R', 'U', 'I', 'T', 'S'],
];

export function WordSearchGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<'instructions' | 'playing' | 'completed'>('instructions');
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedWordInput, setSelectedWordInput] = useState('');
  const [score, setScore] = useState(0);

  const handleStart = () => {
    setFoundWords([]);
    setSelectedWordInput('');
    setScore(0);
    setGameState('playing');
  };

  const handleSelectWord = (word: string) => {
    if (WORD_SEARCH_WORDS.includes(word) && !foundWords.includes(word)) {
      const updated = [...foundWords, word];
      setFoundWords(updated);
      setScore((s) => s + 30);

      if (updated.length === WORD_SEARCH_WORDS.length) {
        setTimeout(() => setGameState('completed'), 500);
      }
    }
  };

  const progressPercent = Math.round((foundWords.length / WORD_SEARCH_WORDS.length) * 100);

  return (
    <GameContainer title="Word Search" progress={progressPercent} onExit={onExit} score={score}>
      {gameState === 'instructions' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-6 animate-in fade-in">
          <div className="h-20 w-20 rounded-3xl bg-teal-500/10 flex items-center justify-center text-teal-600 text-4xl shadow-inner">
            🔍
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Word Search</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Find hidden vocabulary words inside the letter grid!
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={handleStart}>
              Start Search 🚀
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-2xl" onClick={onExit}>
              Exit
            </Button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex flex-col items-center w-full max-w-md space-y-6 animate-in fade-in">
          {/* Words to Find Badges */}
          <div className="flex flex-wrap gap-2 justify-center w-full">
            {WORD_SEARCH_WORDS.map((w) => {
              const isFound = foundWords.includes(w);
              return (
                <button
                  key={w}
                  onClick={() => handleSelectWord(w)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs border-2 transition-all ${
                    isFound
                      ? 'bg-emerald-500 text-white border-emerald-600 line-through'
                      : 'bg-secondary border-border text-foreground hover:border-primary'
                  }`}
                >
                  {w} {isFound ? '✓' : ''}
                </button>
              );
            })}
          </div>

          {/* Letter Grid */}
          <Card className="p-4 rounded-3xl border-2 border-primary/30 shadow-xl bg-card">
            <div className="grid grid-cols-6 gap-2">
              {GRID.map((row, r) =>
                row.map((char, c) => (
                  <div
                    key={`${r}-${c}`}
                    className="w-11 h-11 rounded-xl bg-muted/60 border border-border flex items-center justify-center font-black text-lg text-foreground shadow-sm"
                  >
                    {char}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {gameState === 'completed' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-8 animate-in slide-in-from-bottom-8">
          <div className="text-7xl animate-bounce">🔍</div>
          <h2 className="text-3xl font-extrabold">All Words Found!</h2>
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
