import React, { useState } from 'react';
import { GameContainer } from './GameContainer';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { RefreshCw, ArrowLeft, Flame, Sparkles, CheckCircle2 } from 'lucide-react';

export function DailyChallengeGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<'instructions' | 'playing' | 'completed'>('instructions');
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(0);

  const handleStart = () => {
    setStage(1);
    setScore(0);
    setGameState('playing');
  };

  const handleAdvanceStage = () => {
    setScore((s) => s + 35);
    if (stage < 3) {
      setStage((st) => st + 1);
    } else {
      setGameState('completed');
    }
  };

  const progressPercent = Math.round((stage / 3) * 100);

  return (
    <GameContainer title="Daily Challenge" progress={progressPercent} onExit={onExit} score={score}>
      {gameState === 'instructions' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-6 animate-in fade-in">
          <div className="h-20 w-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-600 text-4xl shadow-inner">
            🔥
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Daily Mixed Challenge</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Complete a 3-round streak of vocabulary, reading, and listening challenges!
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-lg" onClick={handleStart}>
              Start Daily Streak 🚀
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-2xl" onClick={onExit}>
              Exit
            </Button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex flex-col items-center w-full max-w-md space-y-6 animate-in fade-in">
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-4 py-1.5 text-xs">
            Round {stage} of 3 • {stage === 1 ? 'Vocabulary Match' : stage === 2 ? 'Sentence Construction' : 'Audio Recognition'}
          </Badge>

          <Card className="p-6 rounded-3xl border-2 border-primary/30 bg-card shadow-lg flex flex-col items-center space-y-4 w-full text-center">
            <div className="text-5xl">{stage === 1 ? '🍎' : stage === 2 ? '✍️' : '🎧'}</div>
            <h3 className="text-xl font-extrabold text-foreground">
              {stage === 1 ? 'Match Apple with Fruit' : stage === 2 ? 'Build: "This is a dog"' : 'Hear audio: "Bus Station"'}
            </h3>
            <p className="text-xs text-muted-foreground">Tap complete to finish this daily streak round!</p>
          </Card>

          <Button size="lg" className="w-full h-14 rounded-2xl font-bold text-lg shadow-md" onClick={handleAdvanceStage}>
            Complete Round {stage} →
          </Button>
        </div>
      )}

      {gameState === 'completed' && (
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6 py-8 animate-in slide-in-from-bottom-8">
          <div className="text-7xl animate-bounce">🔥</div>
          <h2 className="text-3xl font-extrabold">Daily Streak Extended!</h2>
          <Card className="p-6 w-full rounded-3xl border-primary/20 bg-primary/5 space-y-2">
            <div className="text-xs font-bold uppercase text-muted-foreground">Total XP Earned</div>
            <div className="text-4xl font-black text-primary">+{score} XP</div>
          </Card>
          <div className="flex gap-3 w-full">
            <Button size="lg" className="flex-1 h-14 rounded-2xl text-lg font-bold gap-2 shadow-lg" onClick={handleStart}>
              <RefreshCw className="h-5 w-5" /> Play Again
            </Button>
            <Button size="lg" variant="outline" className="h-14 rounded-2xl gap-2" onClick={onExit}>
              <ArrowLeft className="h-5 w-5" /> Back to Games
            </Button>
          </div>
        </div>
      )}
    </GameContainer>
  );
}
