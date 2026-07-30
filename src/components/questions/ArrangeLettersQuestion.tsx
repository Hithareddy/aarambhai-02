import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { RefreshCcw, Type } from 'lucide-react';

interface ArrangeLettersQuestionProps {
  questionText: string;
  scrambledLetters: string; // e.g. "PPAEL"
  onSelect: (value: string) => void;
  submitting?: boolean;
}

export function ArrangeLettersQuestion({
  questionText,
  scrambledLetters,
  onSelect,
  submitting = false,
}: ArrangeLettersQuestionProps) {
  // Array of letter objects: { id: 0, char: 'P' }
  const initialTokens = scrambledLetters.split('').map((char, i) => ({ id: i, char }));

  const [available, setAvailable] = useState(initialTokens);
  const [selected, setSelected] = useState<{ id: number; char: string }[]>([]);

  const handleLetterClick = (token: { id: number; char: string }) => {
    if (submitting) return;

    const newAvailable = available.filter((t) => t.id !== token.id);
    const newSelected = [...selected, token];

    setAvailable(newAvailable);
    setSelected(newSelected);

    const resultWord = newSelected.map((t) => t.char).join('');
    onSelect(resultWord);
  };

  const handleRemoveLetter = (token: { id: number; char: string }) => {
    if (submitting) return;

    const newSelected = selected.filter((t) => t.id !== token.id);
    const newAvailable = [...available, token];

    setSelected(newSelected);
    setAvailable(newAvailable);

    const resultWord = newSelected.map((t) => t.char).join('');
    onSelect(resultWord);
  };

  const handleReset = () => {
    if (submitting) return;
    setAvailable(initialTokens);
    setSelected([]);
    onSelect('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Badge variant="outline" className="gap-1 text-xs font-bold text-primary">
          <Type className="h-3.5 w-3.5" /> Letter Unscramble
        </Badge>
        <h3 className="text-xl font-extrabold tracking-tight text-foreground">{questionText}</h3>
      </div>

      <div className="space-y-4">
        {/* Assembled Word Output Slot */}
        <div className="p-6 rounded-3xl border-2 border-dashed border-primary/30 bg-primary/5 min-h-[100px] flex flex-col items-center justify-center relative">
          <span className="text-xs font-bold uppercase tracking-wider text-primary/70 absolute top-3 left-4">
            Your Word
          </span>

          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-2.5 my-2">
              {selected.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleRemoveLetter(t)}
                  disabled={submitting}
                  className="h-14 w-12 rounded-2xl bg-card border-2 border-primary text-primary font-black text-2xl shadow-sm hover:border-destructive hover:text-destructive transition-all active:scale-95 flex items-center justify-center"
                >
                  {t.char}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-sm font-medium text-muted-foreground/60 italic">
              Tap letters below to form the word
            </span>
          )}

          {selected.length > 0 && !submitting && (
            <button
              onClick={handleReset}
              className="absolute bottom-3 right-4 flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>

        {/* Scrambled Letter Tokens */}
        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Available Letters
          </span>

          <div className="flex flex-wrap gap-3">
            {available.length > 0 ? (
              available.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleLetterClick(t)}
                  disabled={submitting}
                  className="h-14 w-12 rounded-2xl bg-secondary text-secondary-foreground border-2 border-transparent font-black text-2xl shadow-sm hover:border-primary hover:bg-primary/10 transition-all active:scale-95 flex items-center justify-center"
                >
                  {t.char}
                </button>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">All letters placed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
