import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FlashCardGame } from '../components/games/FlashCardGame';
import { PictureMatchGame } from '../components/games/PictureMatchGame';

export const Route = createFileRoute('/_app/games')({
    component: GamesHub,
});

function GamesHub() {
    const [playing, setPlaying] = useState<string | null>(null);

    const mockGames = [
        { id: 'flash_cards', title: 'Flash Cards', emoji: '🃏', description: 'Flip and learn' },
        { id: 'picture_match', title: 'Picture Match', emoji: '🖼️', description: 'Match the image' },
        { id: 'memory_match', title: 'Memory Match', emoji: '🧠', description: 'Find pairs' },
    ];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Educational Games</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {mockGames.map((game) => (
                    <Card key={game.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
                            <span className="text-6xl">{game.emoji}</span>
                            <h3 className="text-xl font-semibold">{game.title}</h3>
                            <p className="text-sm text-muted-foreground text-center">{game.description}</p>
                            <Button className="w-full">Play</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
