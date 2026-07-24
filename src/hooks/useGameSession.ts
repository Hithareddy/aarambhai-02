import { useState, useCallback } from 'react';
import api from '../lib/api';

export interface GameContentNode {
    id: string;
    target_text: string;
    image_url?: string;
    audio_url?: string;
}

export function useGameSession(gameId: string) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState<GameContentNode[]>([]);
    const [score, setScore] = useState(0);
    const [progress, setProgress] = useState(0);

    const startGame = useCallback(async (level: number = 1) => {
        setLoading(true);
        try {
            // Create session in backend
            const res = await api.post(`/games/${gameId}/start?level=${level}`);
            setSessionId(res.data.session_id);

            // In a full implementation, this payload comes from adaptive backend DB
            // Mocking for frontend scaffolding integration:
            setContent([
                { id: '1', target_text: 'Apple', image_url: '/assets/images/apple.svg' },
                { id: '2', target_text: 'Dog', image_url: '/assets/images/dog.svg' },
            ]);
            setScore(0);
            setProgress(0);
        } catch (error) {
            console.error('Failed to start game session:', error);
        } finally {
            setLoading(false);
        }
    }, [gameId]);

    const recordAttempt = useCallback(async (targetId: string, isCorrect: boolean) => {
        if (!sessionId) return;

        if (isCorrect) {
            setScore(s => s + 10);
        }

        // In production, sync this attempt to DB for analytics
        /*
        await api.post(`/games/session/${sessionId}/submit`, {
          target_id: targetId,
          is_correct: isCorrect,
        });
        */
    }, [sessionId]);

    const advanceProgress = useCallback((increment: number = 10) => {
        setProgress(p => Math.min(p + increment, 100));
    }, []);

    return {
        sessionId,
        loading,
        content,
        score,
        progress,
        startGame,
        recordAttempt,
        advanceProgress
    };
}
