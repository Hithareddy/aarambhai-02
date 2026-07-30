import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { BookOpen, FileText } from 'lucide-react';

interface ReadingScenarioQuestionProps {
  questionText: string;
  image?: string;
  options: { id: string; text: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
  submitting?: boolean;
}

export function ReadingScenarioQuestion({
  questionText,
  image,
  options,
  selected,
  onSelect,
  submitting = false,
}: ReadingScenarioQuestionProps) {
  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-xl mx-auto animate-in fade-in duration-300">
      <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20 text-xs font-extrabold px-3 py-1">
        Practical Reading Activity
      </Badge>

      <h3 className="text-xl font-black text-center text-foreground">{questionText}</h3>

      {/* Visual Document Card (Road Sign, Ticket, Label, Paragraph) */}
      <Card className="w-full p-6 rounded-3xl border-2 border-indigo-500/20 bg-indigo-500/5 shadow-md flex flex-col items-center justify-center space-y-4">
        {image ? (
          <div className="h-44 w-full flex items-center justify-center p-2">
            <img src={image} alt="Reading document visual" className="h-full object-contain drop-shadow" />
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-card border text-sm text-foreground leading-relaxed w-full">
            <FileText className="h-6 w-6 text-indigo-600 mb-2" />
            <p className="font-semibold italic text-muted-foreground">"The girl is drinking water after running."</p>
          </div>
        )}
      </Card>

      {/* 4 Answer Choice Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => !submitting && onSelect(opt.id)}
              disabled={submitting}
              className={`p-4 rounded-2xl border-2 font-black text-base text-center transition-all duration-200 shadow-sm ${
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
