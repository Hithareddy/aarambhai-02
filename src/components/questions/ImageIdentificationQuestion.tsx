import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Image as ImageIcon, Volume2 } from 'lucide-react';
import { Button } from '../ui/button';

interface ImageIdentificationQuestionProps {
  questionText: string;
  image: string;
  options: { id: string; text: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
  submitting?: boolean;
}

export function ImageIdentificationQuestion({
  questionText,
  image,
  options,
  selected,
  onSelect,
  submitting = false,
}: ImageIdentificationQuestionProps) {
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
      {/* Question Prompt Header */}
      <div className="flex items-center justify-between w-full">
        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-xs font-extrabold px-3 py-1">
          Picture Identification
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => speakText(questionText)}
          className="rounded-full gap-1.5 text-xs font-bold border-primary/30 text-primary"
        >
          <Volume2 className="h-4 w-4" /> Listen Prompt
        </Button>
      </div>

      <h3 className="text-2xl font-black tracking-tight text-center text-foreground">{questionText}</h3>

      {/* ONE Large Image Card */}
      <Card className="w-64 h-64 sm:w-72 sm:h-72 bg-gradient-to-b from-white to-slate-50 dark:from-card dark:to-card/80 border-4 border-primary/20 rounded-3xl shadow-xl flex items-center justify-center p-6 relative overflow-hidden group">
        <img
          src={image}
          alt={questionText}
          className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
        />
      </Card>

      {/* 4 Beautiful Answer Text Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
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
              className={`p-5 rounded-2xl border-2 font-black text-lg text-center transition-all duration-200 shadow-sm ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary scale-102 shadow-lg ring-4 ring-primary/20'
                  : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5 text-foreground'
              }`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
