import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Building2, Landmark, Store, Bus, CreditCard, HeartPulse, MessageSquare } from 'lucide-react';

interface EverydayScenarioQuestionProps {
  questionText: string;
  category: string;
  scenario?: string;
  options: { id: string; text: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
  submitting?: boolean;
}

export function EverydayScenarioQuestion({
  questionText,
  category,
  scenario,
  options,
  selected,
  onSelect,
  submitting = false,
}: EverydayScenarioQuestionProps) {
  const getScenarioIcon = () => {
    const c = category.toLowerCase();
    if (c.includes('atm') || c.includes('bank')) return CreditCard;
    if (c.includes('hospital') || c.includes('medicine')) return HeartPulse;
    if (c.includes('bus')) return Bus;
    if (c.includes('shop') || c.includes('market')) return Store;
    return Building2;
  };

  const IconComp = getScenarioIcon();

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-xl mx-auto animate-in fade-in duration-300">
      <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20 text-xs font-extrabold px-3 py-1">
        Everyday Life Scenario
      </Badge>

      <Card className="w-full p-6 rounded-3xl border-2 border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-background to-card shadow-md flex flex-col space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-teal-500 text-white shrink-0 shadow-md">
            <IconComp className="h-8 w-8" />
          </div>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-1">
              {category} Context
            </span>
            <h3 className="text-lg font-extrabold leading-snug text-foreground">{questionText}</h3>
          </div>
        </div>

        {scenario && (
          <div className="p-4 rounded-2xl bg-card border text-sm text-foreground leading-relaxed w-full">
            <MessageSquare className="h-5 w-5 text-teal-600 mb-1" />
            <p className="font-semibold text-foreground text-base tracking-wide leading-relaxed">
              "{scenario}"
            </p>
          </div>
        )}
      </Card>

      {/* 4 Large Choice Buttons */}
      <div className="grid grid-cols-1 gap-3 w-full pt-2">
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => !submitting && onSelect(opt.id)}
              disabled={submitting}
              className={`p-4 sm:p-5 rounded-2xl border-2 font-extrabold text-base text-left transition-all duration-200 shadow-sm flex items-center justify-between ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary scale-102 shadow-lg ring-4 ring-primary/20'
                  : 'bg-card border-border hover:border-primary/50 hover:bg-primary/5 text-foreground'
              }`}
            >
              <span>{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
