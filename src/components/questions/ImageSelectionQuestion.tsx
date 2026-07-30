import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Volume2 } from 'lucide-react';
import { Button } from '../ui/button';

interface ImageOption {
  id: string;
  text: string;
  image?: string;
}

interface ImageSelectionQuestionProps {
  questionText: string;
  options: ImageOption[];
  selected: string | null;
  onSelect: (id: string) => void;
  submitting?: boolean;
}

export function ImageSelectionQuestion({
  questionText,
  options,
  selected,
  onSelect,
  submitting = false,
}: ImageSelectionQuestionProps) {
  const speakText = (t: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between w-full">
        <Badge className="bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20 text-xs font-extrabold px-3 py-1">
          Select Correct Picture
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => speakText(questionText)}
          className="rounded-full gap-1.5 text-xs font-bold border-primary/30 text-primary"
        >
          <Volume2 className="h-4 w-4" /> Listen Question
        </Button>
      </div>

      <h3 className="text-2xl font-black tracking-tight text-center text-foreground">{questionText}</h3>

      {/* 4 LARGE IMAGE CARDS */}
      <div className="grid grid-cols-2 gap-4 w-full pt-2">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => {
                if (!submitting) {
                  onSelect(opt.id);
                  speakText(opt.text);
                }
              }}
              disabled={submitting}
              className={`p-4 sm:p-5 rounded-3xl border-4 flex flex-col items-center justify-center space-y-3 transition-all duration-200 shadow-md ${
                isSelected
                  ? 'border-primary bg-primary/10 scale-105 shadow-xl ring-4 ring-primary/20'
                  : 'border-border/80 bg-card hover:border-primary/50 hover:scale-102'
              }`}
            >
              {opt.image ? (
                <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center p-2">
                  <img src={opt.image} alt={opt.text} className="w-full h-full object-contain drop-shadow-md" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-3xl text-primary">
                  {opt.text}
                </div>
              )}
              <span className="font-extrabold text-lg text-foreground text-center">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
