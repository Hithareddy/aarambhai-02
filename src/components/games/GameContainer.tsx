import React from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

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
    children
}: GameContainerProps) {
    const t = (key: string) => key.split('.').pop()?.replace('_', ' ') || key;

    return (
        <div className="flex flex-col min-h-[60vh] border rounded-xl shadow-sm bg-background/50 overflow-hidden w-full max-w-5xl mx-auto">
            {/* Header Bar */}
            <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={onExit}>
                        {t('common.exit')}
                    </Button>
                    <h3 className="font-semibold text-lg">{title}</h3>
                </div>

                <div className="flex items-center space-x-4 w-1/3">
                    <Progress value={progress} className="h-2 flex-1" />
                    <div className="font-mono font-bold text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                        {t('games.score')}: {score}
                    </div>
                </div>
            </div>

            {/* Main Game Stage */}
            <div className="flex-1 flex flex-col p-6 items-center justify-center relative min-h-[400px]">
                {children}
            </div>

            {/* Footer Controls */}
            <div className="p-4 bg-muted/30 border-t flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {/* Audio toggle or settings could go here */}
                </div>
                {isCompleted && onNext && (
                    <Button onClick={onNext} size="lg" className="animate-in fade-in zoom-in duration-300">
                        {t('common.next')}
                    </Button>
                )}
            </div>
        </div>
    );
}
