import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Layers, CheckCircle2 } from 'lucide-react';

interface CategorizationBucket {
  category: string;
  items: string[];
}

interface CategorizationQuestionProps {
  questionText: string;
  buckets: CategorizationBucket[];
  onSelect: (value: string[]) => void;
  submitting?: boolean;
}

export function CategorizationQuestion({
  questionText,
  buckets,
  onSelect,
  submitting = false,
}: CategorizationQuestionProps) {
  // Collect all items to sort
  const allItems = buckets.flatMap((b) => b.items).sort(() => 0.5 - Math.random());

  // Placed map: { "Apple": "Fruit", "Dog": "Animal", ... }
  const [placedItems, setPlacedItems] = useState<Record<string, string>>({});
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const handleItemClick = (item: string) => {
    if (submitting) return;
    setActiveItem(item === activeItem ? null : item);
  };

  const handleBucketClick = (category: string) => {
    if (!activeItem || submitting) return;

    const updated = { ...placedItems, [activeItem]: category };
    setPlacedItems(updated);
    setActiveItem(null);

    // Format output string array e.g. ["Fruit:Apple,Banana", "Vehicle:Car"]
    const categoryGroups: Record<string, string[]> = {};
    Object.entries(updated).forEach(([item, cat]) => {
      if (!categoryGroups[cat]) categoryGroups[cat] = [];
      categoryGroups[cat].push(item);
    });

    const payload = Object.entries(categoryGroups).map(([cat, items]) => `${cat}:${items.join(',')}`);
    onSelect(payload);
  };

  const unplacedItems = allItems.filter((item) => !placedItems[item]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Badge variant="outline" className="gap-1 text-xs font-bold text-primary">
          <Layers className="h-3.5 w-3.5" /> Categorization Activity
        </Badge>
        <h3 className="text-xl font-extrabold tracking-tight text-foreground">{questionText}</h3>
      </div>

      {/* Available Items Pool */}
      <div className="p-4 bg-muted/30 rounded-2xl border space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Items to Sort (Tap an item, then tap a category box below):
        </span>
        <div className="flex flex-wrap gap-2.5">
          {unplacedItems.length > 0 ? (
            unplacedItems.map((item) => {
              const isSelected = activeItem === item;
              return (
                <button
                  key={item}
                  onClick={() => handleItemClick(item)}
                  disabled={submitting}
                  className={`px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all shadow-sm ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary scale-105 shadow-md'
                      : 'bg-card border-border hover:border-primary/50 text-foreground'
                  }`}
                >
                  {item}
                </button>
              );
            })
          ) : (
            <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 py-1">
              <CheckCircle2 className="h-4 w-4" /> All items sorted!
            </div>
          )}
        </div>
      </div>

      {/* Bucket Drop Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {buckets.map((b) => {
          const itemsInBucket = Object.entries(placedItems)
            .filter(([_, cat]) => cat === b.category)
            .map(([item]) => item);

          return (
            <button
              key={b.category}
              onClick={() => handleBucketClick(b.category)}
              disabled={submitting || !activeItem}
              className={`p-5 rounded-3xl border-2 text-left flex flex-col justify-between min-h-[140px] transition-all shadow-sm ${
                activeItem
                  ? 'border-primary/60 bg-primary/5 hover:bg-primary/10 cursor-pointer shadow-md'
                  : 'border-border/80 bg-card'
              }`}
            >
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary block mb-2">
                  Category: {b.category}
                </span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {itemsInBucket.map((item) => (
                    <Badge key={item} variant="secondary" className="font-bold text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              {activeItem && (
                <span className="text-xs font-bold text-primary animate-pulse mt-4 block">
                  Tap to place "{activeItem}" here →
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
