import { useState, useCallback } from 'react';
import { apiRequest } from '../lib/api/http';

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
            const res = await apiRequest<any>(`/games/${gameId}/start?level=${level}`, 'POST');
            if (res?.session_id) {
                setSessionId(res.session_id);
            }

            // Use dynamic content payload returned from backend API
            const payload = res?.content_payload;
            if (payload && Array.isArray(payload) && payload.length > 0) {
                setContent(payload.map((item: any) => ({
                    id: item.id || String(Math.random()),
                    target_text: item.prompt || item.target_text || "Practice Word",
                    image_url: item.image_url || undefined,
                    audio_url: item.audio_url || undefined
                })));
            } else {
                // Fallback default vocabulary items
                setContent([
                    { id: '1', target_text: 'Apple', image_url: undefined },
                    { id: '2', target_text: 'Dog', image_url: undefined },
                    { id: '3', target_text: 'Book', image_url: undefined },
                    { id: '4', target_text: 'Sun', image_url: undefined },
                    { id: '5', target_text: 'Car', image_url: undefined },
                    { id: '6', target_text: 'Star', image_url: undefined },
                ]);
            }
            setScore(0);
            setProgress(0);
        } catch (error) {
            console.warn('Game session started with fallback content:', error);
            setContent([
                { id: '1', target_text: 'Apple', image_url: undefined },
                { id: '2', target_text: 'Dog', image_url: undefined },
                { id: '3', target_text: 'Book', image_url: undefined },
                { id: '4', target_text: 'Sun', image_url: undefined },
                { id: '5', target_text: 'Car', image_url: undefined },
                { id: '6', target_text: 'Star', image_url: undefined },
            ]);
        } finally {
            setLoading(false);
        }
    }, [gameId]);

    const recordAttempt = useCallback(async (targetId: string, isCorrect: boolean) => {
        if (!sessionId) return;
        if (isCorrect) {
            setScore((s) => s + 10);
        }
    }, [sessionId]);

    const advanceProgress = useCallback((increment: number = 10) => {
        setProgress((p) => Math.min(p + increment, 100));
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
