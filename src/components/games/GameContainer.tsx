import React from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useLanguage } from '@/hooks/use-language';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface GameContainerProps {
  title: string;
  progress: number;
  onExit: () => void;
  onNext?: () => void;
  isCompleted?: boolean;
  score?: number;
  children: React.ReactNode;
}

export function GameContainer({
  title,
  progress,
  onExit,
  onNext,
  isCompleted = false,
  score = 0,
  children,
}: GameContainerProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-[65vh] border-2 border-border/80 rounded-3xl shadow-lg bg-card overflow-hidden w-full max-w-5xl mx-auto my-4 animate-in fade-in duration-300">
      {/* Multilingual Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-muted/40 border-b border-border/60">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onExit} className="rounded-xl font-bold gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>{t('common.exit') || t('onboarding.back') || 'Exit'}</span>
          </Button>
          <div className="h-4 w-px bg-border shrink-0" />
          <h3 className="font-extrabold text-lg tracking-tight text-foreground">{title}</h3>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 w-36">
            <Progress value={progress} className="h-2 rounded-full flex-1" />
            <span className="text-xs font-mono font-bold text-muted-foreground">{progress}%</span>
          </div>
          <div className="font-mono font-black text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-2xl flex items-center gap-1.5 border border-primary/20">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>{t('games.score') || 'Score'}: {score}</span>
          </div>
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="flex-1 flex flex-col p-6 items-center justify-center relative min-h-[420px]">
        {children}
      </div>

      {/* Footer Controls */}
      {isCompleted && onNext && (
        <div className="p-4 bg-muted/30 border-t flex justify-end items-center">
          <Button onClick={onNext} size="lg" className="rounded-2xl font-bold px-6 shadow-md animate-in fade-in zoom-in">
            {t('common.next') || 'Next →'}
          </Button>
        </div>
      )}
    </div>
  );
}
