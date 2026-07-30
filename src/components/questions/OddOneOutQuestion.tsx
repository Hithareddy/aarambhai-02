import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Sparkles, CheckCircle2, XCircle } from 'lucide-react';

interface OddOption {
  id: string;
  text: string;
  image?: string;
}

interface OddOneOutQuestionProps {
  questionText: string;
  options: OddOption[];
  selected: string | null;
  onSelect: (value: string) => void;
  submitting?: boolean;
}

export function OddOneOutQuestion({
  questionText,
  options,
  selected,
  onSelect,
  submitting = false,
}: OddOneOutQuestionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Badge variant="outline" className="gap-1 text-xs font-bold text-amber-600 border-amber-500/30 bg-amber-500/10">
          <Sparkles className="h-3.5 w-3.5" /> Odd One Out
        </Badge>
        <h3 className="text-xl font-extrabold tracking-tight text-foreground">{questionText}</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {options.map((opt) => {
          const isSelected = selected === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => !submitting && onSelect(opt.id)}
              disabled={submitting}
              className={`p-4 rounded-3xl border-2 flex flex-col items-center justify-center space-y-3 transition-all duration-200 shadow-sm ${
                isSelected
                  ? 'border-primary bg-primary/10 scale-105 shadow-md ring-2 ring-primary/40'
                  : 'border-border/80 bg-card hover:border-primary/40 hover:scale-102'
              }`}
            >
              {opt.image ? (
                <div className="w-24 h-24 flex items-center justify-center p-2">
                  <img src={opt.image} alt={opt.text} className="w-full h-full object-contain drop-shadow" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center font-black text-2xl text-muted-foreground">
                  {opt.text.charAt(0)}
                </div>
              )}
              <span className="font-extrabold text-base text-foreground text-center">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
