import React, { useEffect, useState } from 'react';
import { GameContainer } from './GameContainer';
import { DragDropEngine, DragItem } from './DragDropEngine';
import { useGameSession } from '../../hooks/useGameSession';
import { useLearningLanguage } from '../../hooks/useLearningLanguage';
import { Button } from '../ui/button';

export function PictureMatchGame({ onExit }: { onExit: () => void }) {
    const { content, loading, startGame, recordAttempt, advanceProgress, progress } = useGameSession('picture_match');
    const t = (key: string) => key.split('.').pop()?.replace('_', ' ') || key;
    const { learningLang } = useLearningLanguage();

    const [currentIndex, setCurrentIndex] = useState(0);

    const [sourceBank, setSourceBank] = useState<DragItem[]>([]);
    const [targetSlot, setTargetSlot] = useState<DragItem[]>([]);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    useEffect(() => {
        startGame(1);
    }, [startGame]);

    useEffect(() => {
        if (content.length > 0 && currentIndex < content.length) {
            const current = content[currentIndex];
            const bank = [
                { id: current.id, content: <span className="text-xl font-bold">{current.target_text}</span> },
                { id: 'distractor_1', content: <span className="text-xl font-bold">Cat</span> },
                { id: 'distractor_2', content: <span className="text-xl font-bold">Tree</span> }
            ].sort(() => Math.random() - 0.5);

            setSourceBank(bank);
            setTargetSlot([]);
            setIsCorrect(null);
        }
    }, [content, currentIndex]);

    if (loading || !content.length) {
        return (
            <GameContainer title={t('games.picture_match')} progress={0} onExit={onExit}>
                <div>{t('common.loading')}</div>
            </GameContainer>
        );
    }

    const isCompleted = currentIndex >= content.length;
    const activePrompt = content[currentIndex];

    const handleSequenceChange = (newTarget: DragItem[]) => {
        const slot = newTarget.length > 1 ? [newTarget[newTarget.length - 1]] : newTarget;
        setTargetSlot(slot);

        if (slot.length === 1) {
            const correct = slot[0].id === activePrompt.id;
            setIsCorrect(correct);
            recordAttempt(slot[0].id, correct);

            if (correct) {
                advanceProgress(100 / content.length);
            }
        } else {
            setIsCorrect(null);
        }
    };

    const handeNextPrompt = () => {
        if (currentIndex < content.length - 1) {
            setCurrentIndex(c => c + 1);
        } else {
            setCurrentIndex(content.length);
            advanceProgress(100);
        }
    };

    return (
        <GameContainer
            title={t('games.picture_match')}
            progress={progress}
            onExit={onExit}
            isCompleted={isCompleted}
            onNext={onExit}
        >
            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-4xl space-y-12">
                    <h2 className="text-2xl font-semibold text-muted-foreground">{t('games.drag_matching_word')}</h2>

                    <div className="w-56 h-56 bg-card border-4 border-primary/20 rounded-2xl shadow-sm flex items-center justify-center p-4">
                        {activePrompt?.image_url ? (
                            <img src={activePrompt.image_url} alt="Prompt" className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-6xl text-muted">?</div>
                        )}
                    </div>

                    <div className="w-full relative">
                        <DragDropEngine
                            sourceItems={sourceBank}
                            targetItems={targetSlot}
                            onSequenceChange={handleSequenceChange}
                            orientation="horizontal"
                            droppableId="picture-match-slot"
                        />

                        {isCorrect !== null && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 transform translate-x-12">
                                {isCorrect ? (
                                    <div className="flex flex-col items-center space-y-4 animate-in zoom-in slide-in-from-left-4">
                                        <span className="text-5xl drop-shadow-sm">✅</span>
                                        <Button size="lg" className="rounded-full shadow-lg" onClick={handeNextPrompt}>
                                            {t('common.continue')}
                                        </Button>
                                    </div>
                                ) : (
                                    <span className="text-5xl animate-bounce drop-shadow-sm">❌</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center space-y-6">
                    <span className="text-7xl animate-pulse">🌟</span>
                    <h2 className="text-3xl font-bold">{t('games.match_completed')}</h2>
                    <p className="text-muted-foreground">{t('games.match_reward')}</p>
                </div>
            )}
        </GameContainer>
    );
}
