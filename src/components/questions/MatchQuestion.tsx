import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Link2, CheckCircle2, Sparkles, Check } from 'lucide-react';

export interface MatchingPairItem {
  id: string;
  leftText: string;
  leftImage?: string;
  rightText: string;
  rightImage?: string;
}

export interface MatchQuestionProps {
  prompt: string;
  options: any[];
  selected: any;
  onSelect: (val: any) => void;
  submitting?: boolean;
}

const MATCH_COLORS = [
  { bg: 'bg-emerald-500/15', border: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-500' },
  { bg: 'bg-sky-500/15', border: 'border-sky-500', text: 'text-sky-700 dark:text-sky-300', badge: 'bg-sky-500' },
  { bg: 'bg-amber-500/15', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-300', badge: 'bg-amber-500' },
  { bg: 'bg-purple-500/15', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-500' },
];

export function MatchQuestion({
  prompt,
  options,
  selected,
  onSelect,
  submitting = false,
}: MatchQuestionProps) {
  // Parse input options into normalized matching pairs
  const pairs: MatchingPairItem[] = (options || []).map((opt, idx) => {
    if (opt.left && opt.right) {
      return {
        id: opt.id || `pair-${idx}`,
        leftText: opt.left,
        leftImage: opt.leftImage,
        rightText: opt.right,
        rightImage: opt.rightImage,
      };
    }
    const parts = (opt.text || opt.id || '').split(/[-:]/);
    return {
      id: opt.id || `pair-${idx}`,
      leftText: parts[0]?.trim() || `Item ${idx + 1}`,
      leftImage: opt.image || opt.rightImage,
      rightText: parts[1]?.trim() || `Category ${idx + 1}`,
    };
  });

  const leftList = pairs.map((p) => ({ id: p.id, text: p.leftText, image: p.leftImage }));

  // Shuffle right items once so they are visible from the start but not aligned 1-to-1
  const [rightList] = useState(() => {
    return pairs
      .map((p) => ({ id: p.id, targetText: p.rightText, image: p.rightImage }))
      .sort(() => Math.random() - 0.5);
  });

  // Active selection state
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);

  // Pairings state: { [leftId]: rightTargetText }
  const [matches, setMatches] = useState<Record<string, string>>({});

  const handleLeftTap = (id: string) => {
    if (submitting) return;
    if (selectedLeftId === id) {
      setSelectedLeftId(null);
    } else {
      setSelectedLeftId(id);
    }
  };

  const handleRightTap = (targetText: string) => {
    if (submitting) return;

    if (selectedLeftId) {
      const updated = { ...matches, [selectedLeftId]: targetText };
      setMatches(updated);
      setSelectedLeftId(null);

      // Format payload for evaluation: ["Apple-Fruit", "Dog-Animal"]
      const payload = pairs.map((p) => `${p.leftText}-${updated[p.id] || ''}`);
      onSelect(payload);
    }
  };

  const handleUnpair = (leftId: string) => {
    if (submitting) return;
    const updated = { ...matches };
    delete updated[leftId];
    setMatches(updated);

    const payload = pairs.map((p) => `${p.leftText}-${updated[p.id] || ''}`);
    onSelect(payload);
  };

  const matchedCount = Object.keys(matches).length;
  const totalCount = pairs.length;

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto animate-in fade-in duration-300">
      {/* Activity Header Bar */}
      <div className="flex items-center justify-between">
        <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-xs font-extrabold px-3 py-1">
          <Link2 className="h-3.5 w-3.5 mr-1" /> Interactive Tap-to-Match Game
        </Badge>
        <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          Matched {matchedCount} of {totalCount} pairs
        </span>
      </div>

      <h3 className="text-2xl font-black tracking-tight text-center text-foreground">{prompt}</h3>

      {/* Two Parallel Columns Displayed Simultaneously */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full pt-2">
        {/* LEFT COLUMN ITEMS */}
        <div className="space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block text-center">
            Step 1: Tap Left Card
          </span>

          {leftList.map((item, idx) => {
            const isSelected = selectedLeftId === item.id;
            const matchedRightText = matches[item.id];
            const colorScheme = MATCH_COLORS[idx % MATCH_COLORS.length];

            return (
              <div key={item.id} className="relative">
                <button
                  onClick={() => handleLeftTap(item.id)}
                  disabled={submitting}
                  className={`w-full p-4 rounded-2xl border-4 text-left font-black text-base transition-all duration-200 shadow-md flex items-center justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/10 scale-105 shadow-xl ring-4 ring-primary/30'
                      : matchedRightText
                      ? `${colorScheme.border} ${colorScheme.bg} shadow-md`
                      : 'border-border/80 bg-card hover:border-primary/50 hover:scale-102 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.image && (
                      <img src={item.image} alt={item.text} className="w-8 h-8 object-contain shrink-0" />
                    )}
                    <span className="truncate">{item.text}</span>
                  </div>

                  {matchedRightText && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnpair(item.id);
                      }}
                      className={`h-6 w-6 rounded-full ${colorScheme.badge} text-white flex items-center justify-center text-xs font-bold shrink-0 hover:opacity-80 transition-opacity`}
                      title="Tap to unpair"
                    >
                      ✓
                    </button>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN TARGETS */}
        <div className="space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block text-center">
            Step 2: Tap Right Match
          </span>

          {rightList.map((target, idx) => {
            // Find if any left item has matched to this target
            const matchedLeftPair = pairs.find((p) => matches[p.id] === target.targetText);
            const matchedLeftIdx = matchedLeftPair ? pairs.findIndex((p) => p.id === matchedLeftPair.id) : -1;
            const colorScheme = matchedLeftIdx >= 0 ? MATCH_COLORS[matchedLeftIdx % MATCH_COLORS.length] : null;

            return (
              <button
                key={`${target.id}-${idx}`}
                onClick={() => handleRightTap(target.targetText)}
                disabled={submitting}
                className={`w-full p-4 rounded-2xl border-4 text-left font-black text-base transition-all duration-200 shadow-md flex items-center justify-between ${
                  selectedLeftId && !colorScheme
                    ? 'border-primary/40 bg-primary/5 hover:border-primary hover:scale-105 cursor-pointer shadow-lg'
                    : colorScheme
                    ? `${colorScheme.border} ${colorScheme.bg} shadow-md`
                    : 'border-border/80 bg-card text-foreground opacity-90'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {target.image && (
                    <img src={target.image} alt={target.targetText} className="w-8 h-8 object-contain shrink-0" />
                  )}
                  <span className="truncate">{target.targetText}</span>
                </div>

                {colorScheme && (
                  <span className={`h-6 w-6 rounded-full ${colorScheme.badge} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
