import React, { useState } from 'react';
import { GameContainer } from './GameContainer';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { RefreshCw, ArrowLeft, Check, Sparkles } from 'lucide-react';

export interface CategorySortItem {
  id: string;
  word: string;
  category: 'Fruit' | 'Animal' | 'Vehicle' | 'School';
  image?: string;
}

export const SORT_ITEMS: CategorySortItem[] = [
  { id: 'cs-1', word: 'Apple', category: 'Fruit', image: '/images/fruits/apple.svg' },
  { id: 'cs-2', word: 'Dog', category: 'Animal', image: '/images/animals/dog.svg' },
  { id: 'cs-3', word: 'Car', category: 'Vehicle', image: '/images/vehicles/car.svg' },
  { id: 'cs-4', word: 'Book', category: 'School', image: '/images/objects/book.svg' },
];

const CATEGORIES: ('Fruit' | 'Animal' | 'Vehicle' | 'School')[] = ['Fruit', 'Animal', 'Vehicle', 'School'];

export function CategorySortGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<'instructions' | 'playing' | 'completed'>('instructions');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [sortedMap, setSortedMap] = useState<Record<string, string>>({}); // { [itemId]: category }
  const [score, setScore] = useState(0);

  const handleStart = () => {
    setSelectedItemId(null);
    setSortedMap({});
    setScore(0);
    setGameState('playing');
  };

  const handleItemTap = (id: string) => {
    setSelectedItemId(id === selectedItemId ? null : id);
  };

  const handleCategoryBucketTap = (cat: 'Fruit' | 'Animal' | 'Vehicle' | 'School') => {
    if (selectedItemId) {
      const item = SORT_ITEMS.find((i) => i.id === selectedItemId);
      if (item && item.category === cat) {
        const updated = { ...sortedMap, [selectedItemId]: cat };
        setSortedMap(updated);
        setScore((s) => s + 25);
        setSelectedItemId(null);

        if (Object.keys(updated).length === SORT_ITEMS.length) {
          setTimeout(() => setGameState('completed'), 500);
        }
      } else {
        setSelectedItemId(null);
      }
    }
  };

  const progressPercent = Math.round((Object.keys(sortedMap).length / SORT_ITEMS.length) * 100);

  return (
    <GameContainer title="Category Sort" progress={progressPercent} onExit={onExit} score={score}>
      {gameState === 'instructions' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-6 animate-in fade-in">
          <div className="h-20 w-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-600 text-4xl shadow-inner">
            📦
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Category Sort</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Sort items into Fruit, Animal, Vehicle, and School category buckets!
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={handleStart}>
              Start Sorting 🚀
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-2xl" onClick={onExit}>
              Exit
            </Button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex flex-col items-center w-full max-w-lg space-y-6 animate-in fade-in">
          {/* Unsorted Items Chips */}
          <div className="flex flex-wrap gap-3 justify-center w-full p-4 rounded-3xl bg-card border-2 border-border/80 min-h-[90px]">
            {SORT_ITEMS.map((item) => {
              const isSorted = !!sortedMap[item.id];
              const isSelected = selectedItemId === item.id;
              if (isSorted) return null;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemTap(item.id)}
                  className={`px-4 py-3 rounded-2xl font-black text-base border-3 transition-all shadow-md flex items-center gap-2 ${
                    isSelected
                      ? 'border-primary bg-primary/10 scale-105 shadow-xl ring-4 ring-primary/20'
                      : 'border-border bg-secondary text-secondary-foreground hover:border-primary'
                  }`}
                >
                  {item.image && <img src={item.image} alt={item.word} className="w-6 h-6 object-contain" />}
                  <span>{item.word}</span>
                </button>
              );
            })}
            {Object.keys(sortedMap).length === SORT_ITEMS.length && (
              <span className="text-sm font-extrabold text-emerald-600">All Items Sorted! ✨</span>
            )}
          </div>

          {/* Category Buckets Grid */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {CATEGORIES.map((cat) => {
              const matchedItems = SORT_ITEMS.filter((i) => sortedMap[i.id] === cat);
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryBucketTap(cat)}
                  className={`p-5 rounded-3xl border-3 text-left transition-all shadow-md flex flex-col justify-between min-h-[120px] ${
                    selectedItemId
                      ? 'border-primary/50 bg-primary/5 hover:border-primary hover:scale-102 cursor-pointer shadow-lg'
                      : 'border-border/80 bg-card text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-extrabold text-base tracking-tight">{cat}</span>
                    <Badge variant="secondary" className="font-bold text-xs">
                      {matchedItems.length} Items
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {matchedItems.map((m) => (
                      <span key={m.id} className="text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-xl flex items-center gap-1">
                        ✓ {m.word}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState === 'completed' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-8 animate-in slide-in-from-bottom-8">
          <div className="text-7xl animate-bounce">📦</div>
          <h2 className="text-3xl font-extrabold">Sorting Challenge Completed!</h2>
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
