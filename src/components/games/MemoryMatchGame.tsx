import React, { useState, useEffect } from 'react';
import { GameContainer } from './GameContainer';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Sparkles, RefreshCw, Trophy, ArrowLeft, Volume2, HelpCircle } from 'lucide-react';

interface MemoryCard {
    id: number;
    pairId: string;
    text: string;
    icon: string;
    isFlipped: boolean;
    isMatched: boolean;
}

const INITIAL_PAIRS = [
    { pairId: 'apple', text: 'Apple', icon: '🍎' },
    { pairId: 'dog', text: 'Dog', icon: '🐶' },
    { pairId: 'book', text: 'Book', icon: '📚' },
    { pairId: 'sun', text: 'Sun', icon: '☀️' },
    { pairId: 'car', text: 'Car', icon: '🚗' },
    { pairId: 'star', text: 'Star', icon: '⭐' },
];

export function MemoryMatchGame({ onExit }: { onExit: () => void }) {
    const [gameState, setGameState] = useState<'instructions' | 'playing' | 'completed'>('instructions');
    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [score, setScore] = useState(0);
    const [isLocking, setIsLocking] = useState(false);

    // Initialize & shuffle cards deck
    const initializeDeck = () => {
        const deck: MemoryCard[] = [];
        let idCounter = 0;

        INITIAL_PAIRS.forEach((pair) => {
            // Card 1: Text
            deck.push({
                id: idCounter++,
                pairId: pair.pairId,
                text: pair.text,
                icon: pair.icon,
                isFlipped: false,
                isMatched: false,
            });
            // Card 2: Duplicate pair
            deck.push({
                id: idCounter++,
                pairId: pair.pairId,
                text: pair.text,
                icon: pair.icon,
                isFlipped: false,
                isMatched: false,
            });
        });

        // Shuffle deck
        deck.sort(() => Math.random() - 0.5);
        setCards(deck);
        setFlippedCards([]);
        setMoves(0);
        setScore(0);
        setIsLocking(false);
    };

    const handleStartGame = () => {
        initializeDeck();
        setGameState('playing');
    };

    const speakWord = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleCardClick = (index: number) => {
        if (isLocking) return;
        if (cards[index].isFlipped || cards[index].isMatched) return;

        // Flip card
        const updatedCards = [...cards];
        updatedCards[index].isFlipped = true;
        setCards(updatedCards);

        speakWord(updatedCards[index].text);

        const newFlipped = [...flippedCards, index];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves((m) => m + 1);
            setIsLocking(true);

            const [firstIdx, secondIdx] = newFlipped;
            const firstCard = updatedCards[firstIdx];
            const secondCard = updatedCards[secondIdx];

            if (firstCard.pairId === secondCard.pairId) {
                // Match found!
                setTimeout(() => {
                    setCards((prev) => {
                        const matched = [...prev];
                        matched[firstIdx].isMatched = true;
                        matched[secondIdx].isMatched = true;

                        // Check if all matched
                        if (matched.every((c) => c.isMatched)) {
                            setGameState('completed');
                        }
                        return matched;
                    });
                    setScore((s) => s + 20);
                    setFlippedCards([]);
                    setIsLocking(false);
                }, 500);
            } else {
                // Not a match: flip back after 900ms
                setTimeout(() => {
                    setCards((prev) => {
                        const reset = [...prev];
                        reset[firstIdx].isFlipped = false;
                        reset[secondIdx].isFlipped = false;
                        return reset;
                    });
                    setFlippedCards([]);
                    setIsLocking(false);
                }, 900);
            }
        }
    };

    const progressPercent = cards.length > 0
        ? Math.round((cards.filter((c) => c.isMatched).length / cards.length) * 100)
        : 0;

    return (
        <GameContainer
            title="Memory Match"
            progress={progressPercent}
            onExit={onExit}
            score={score}
        >
            {gameState === 'instructions' && (
                <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-300 py-6">
                    <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-4xl shadow-inner">
                        🧠
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight">Memory Match</h2>
                        <p className="text-muted-foreground mt-2 text-balance leading-relaxed">
                            Flip cards to match word pairs. Remember card locations to pair all 6 vocabulary cards in as few moves as possible!
                        </p>
                    </div>

                    <div className="bg-muted/40 p-4 rounded-2xl border text-left text-xs text-muted-foreground space-y-2 w-full">
                        <div className="flex items-center gap-2 font-bold text-foreground">
                            <HelpCircle className="h-4 w-4 text-primary" />
                            <span>How to Play:</span>
                        </div>
                        <p>1. Tap any card to flip it over.</p>
                        <p>2. Tap a second card to find its matching word pair.</p>
                        <p>3. Matched pairs earn <strong>+20 XP</strong> and remain face up.</p>
                    </div>

                    <div className="flex gap-3 w-full">
                        <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={handleStartGame}>
                            Start Game 🚀
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 rounded-2xl" onClick={onExit}>
                            Exit
                        </Button>
                    </div>
                </div>
            )}

            {gameState === 'playing' && (
                <div className="flex flex-col items-center w-full max-w-3xl space-y-6">
                    {/* Header bar stats */}
                    <div className="flex items-center justify-between w-full px-4 py-2 bg-card rounded-2xl border text-sm font-semibold text-muted-foreground">
                        <span>Moves: <strong className="text-foreground">{moves}</strong></span>
                        <span>Pairs Matched: <strong className="text-primary">{cards.filter((c) => c.isMatched).length / 2} / {INITIAL_PAIRS.length}</strong></span>
                    </div>

                    {/* 4x3 Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-2xl">
                        {cards.map((card, idx) => {
                            const isFaceUp = card.isFlipped || card.isMatched;

                            return (
                                <button
                                    key={card.id}
                                    onClick={() => handleCardClick(idx)}
                                    disabled={card.isMatched || isLocking}
                                    className={`h-28 sm:h-36 rounded-2xl border-2 transition-all duration-300 transform flex flex-col items-center justify-center p-2 shadow-sm ${
                                        card.isMatched
                                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 scale-95 cursor-default'
                                            : isFaceUp
                                            ? 'bg-card border-primary text-primary shadow-md'
                                            : 'bg-gradient-to-br from-primary/80 to-primary text-primary-foreground border-primary/50 hover:scale-105 active:scale-95'
                                    }`}
                                >
                                    {isFaceUp ? (
                                        <div className="flex flex-col items-center space-y-1 animate-in zoom-in-50 duration-200">
                                            <span className="text-3xl sm:text-4xl">{card.icon}</span>
                                            <span className="text-xs sm:text-sm font-bold text-foreground mt-1">{card.text}</span>
                                        </div>
                                    ) : (
                                        <span className="text-2xl font-bold opacity-60">❓</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Control Buttons */}
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={initializeDeck}>
                            <RefreshCw className="h-4 w-4" />
                            Restart
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-xl" onClick={onExit}>
                            Exit Game
                        </Button>
                    </div>
                </div>
            )}

            {gameState === 'completed' && (
                <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 animate-in slide-in-from-bottom-6 duration-400 py-8">
                    <div className="text-7xl animate-bounce">🎉</div>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-extrabold">Awesome Memory!</h2>
                        <p className="text-muted-foreground text-sm">You matched all cards in {moves} moves!</p>
                    </div>

                    <Card className="p-6 w-full rounded-3xl border-primary/20 bg-primary/5 space-y-4">
                        <div className="flex justify-around text-center">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Final Score</div>
                                <div className="text-3xl font-extrabold text-primary">{score} XP</div>
                            </div>
                            <div className="border-r border-border" />
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Moves</div>
                                <div className="text-3xl font-extrabold text-foreground">{moves}</div>
                            </div>
                        </div>
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold gap-2 shadow-lg" onClick={handleStartGame}>
                            <RefreshCw className="h-5 w-5" />
                            Play Again
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 rounded-2xl gap-2" onClick={onExit}>
                            <ArrowLeft className="h-5 w-5" />
                            Back to Games
                        </Button>
                    </div>
                </div>
            )}
        </GameContainer>
    );
}
