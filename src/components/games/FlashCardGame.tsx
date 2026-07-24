import React, { useEffect, useState } from 'react';
import { GameContainer } from './GameContainer';
import { CardFlipEngine } from './CardFlipEngine';
import { useGameSession } from '../../hooks/useGameSession';
import { useLearningLanguage } from '../../hooks/useLearningLanguage';
import { Button } from '../ui/button';

export function FlashCardGame({ onExit }: { onExit: () => void }) {
    const { content, loading, startGame, recordAttempt, advanceProgress, progress } = useGameSession('flash_cards');
    const { learningLang } = useLearningLanguage();
    const t = (key: string) => key.split('.').pop()?.replace('_', ' ') || key;

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        startGame(1);
    }, [startGame]);

    if (loading || !content.length) {
        return (
            <GameContainer title={t('games.flash_cards')} progress={0} onExit={onExit}>
                <div className="animate-pulse flex items-center justify-center text-muted-foreground">
                    {t('common.loading')}
                </div>
            </GameContainer>
        );
    }

    const activeCard = content[currentIndex];
    const isCompleted = currentIndex >= content.length;

    const handleNextCard = () => {
        if (currentIndex < content.length - 1) {
            setCurrentIndex(c => c + 1);
            advanceProgress(100 / content.length);
            recordAttempt(activeCard.id, true);
        } else {
            setCurrentIndex(content.length);
            advanceProgress(100);
        }
    };

    return (
        <GameContainer
            title={t('games.flash_cards')}
            progress={progress}
            onExit={onExit}
            isCompleted={isCompleted}
            onNext={onExit}
        >
            {!isCompleted ? (
                <div className="flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500">
                    <CardFlipEngine
                        width="w-72 md:w-96"
                        height="h-80 md:h-[400px]"
                        frontContent={
                            <div className="flex flex-col items-center justify-center w-full h-full space-y-6">
                                {activeCard.image_url ? (
                                    <img src={activeCard.image_url} alt="Flashcard visual" className="w-48 h-48 object-contain drop-shadow-md" />
                                ) : (
                                    <div className="w-48 h-48 bg-muted rounded-full flex items-center justify-center font-bold text-4xl text-muted-foreground">?</div>
                                )}
                                <span className="text-xl font-medium text-muted-foreground animate-pulse">
                                    {t('games.tap_to_flip')}
                                </span>
                            </div>
                        }
                        backContent={
                            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 shadow-inner w-full h-full">
                                <h2 className="text-5xl font-black text-primary tracking-tight">
                                    {activeCard.target_text}
                                </h2>
                                {learningLang !== 'en' && (
                                    <p className="text-2xl text-muted-foreground font-medium">({activeCard.target_text} - en)</p>
                                )}
                                <Button variant="secondary" className="mt-8 rounded-full shadow" onClick={(e) => {
                                    e.stopPropagation();
                                }}>
                                    🔊 {t('games.listen')}
                                </Button>
                            </div>
                        }
                    />
                    <Button size="lg" className="w-48 shadow-lg text-lg rounded-xl" onClick={handleNextCard}>
                        {t('common.next')}
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center space-y-6 animate-in slide-in-from-bottom-8">
                    <span className="text-7xl">🎉</span>
                    <h2 className="text-3xl font-bold">{t('games.deck_completed')}</h2>
                    <p className="text-muted-foreground">{t('games.deck_message')}</p>
                </div>
            )}
        </GameContainer>
    );
}
