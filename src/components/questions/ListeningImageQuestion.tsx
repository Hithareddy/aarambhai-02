import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Volume2, Play } from 'lucide-react';
import { Button } from '../ui/button';

interface ListeningImageQuestionProps {
  questionText: string;
  audioText: string;
  options: { id: string; text: string; image?: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
  submitting?: boolean;
}

export function ListeningImageQuestion({
  questionText,
  audioText,
  options,
  selected,
  onSelect,
  submitting = false,
}: ListeningImageQuestionProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(true);
      const u = new SpeechSynthesisUtterance(audioText || questionText);
      u.lang = 'en-US';
      u.rate = 0.85;
      u.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-xl mx-auto animate-in fade-in duration-300">
      <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 text-xs font-extrabold px-3 py-1">
        Listening Activity
      </Badge>

      <h3 className="text-xl font-black text-center text-foreground">{questionText}</h3>

      {/* Large Animated Audio Player Button */}
      <Card className="w-full p-6 rounded-3xl border-2 border-primary/20 bg-gradient-to-r from-amber-500/10 via-primary/5 to-background shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={playAudio}
            className={`h-16 w-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-lg transition-transform active:scale-95 ${
              isPlaying ? 'animate-bounce' : 'hover:scale-105'
            }`}
          >
            {isPlaying ? <Volume2 className="h-8 w-8 animate-pulse" /> : <Play className="h-8 w-8 fill-current ml-1" />}
          </button>
          <div>
            <h4 className="text-base font-extrabold text-foreground">Tap to Listen Audio</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Listen carefully, then choose the correct picture below.</p>
          </div>
        </div>
      </Card>

      {/* 4 LARGE IMAGE OPTIONS */}
      <div className="grid grid-cols-2 gap-4 w-full pt-2">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => {
                if (!submitting) onSelect(opt.id);
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
                  <img src={opt.image} alt={opt.text} className="w-full h-full object-contain drop-shadow" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-amber-500/10 flex items-center justify-center font-black text-2xl text-amber-700">
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
