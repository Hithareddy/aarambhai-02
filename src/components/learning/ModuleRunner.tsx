import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Star, Trophy, ArrowRight } from "lucide-react";
import { OfflineQueueService } from "@/lib/api/offlineQueue";
import { QuestionRenderer } from "@/components/questions/QuestionRenderer";

export interface UnifiedActivityResponse {
    id: string;
    activity_type: string;
    title: string;
    module_id: string;
    lesson_id?: string;
    metadata: Record<string, any>;
    content: Record<string, any>;
    adaptive_settings: Record<string, any>;
    rewards: Record<string, any>;
    version: string;
    status: string;
}

export function ModuleRunner({ activities, onFinish }: { activities: UnifiedActivityResponse[], onFinish: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [viewState, setViewState] = useState<"intro" | "playing" | "interstitial" | "summary">("intro");

    const progressPct = Math.round((currentIndex / activities.length) * 100);
    const currentAct = activities[currentIndex];

    const handleNext = async (result: { accuracy: number, completed: boolean, duration: number }) => {
        // 1. Post to offline queue
        if (currentAct) {
            await OfflineQueueService.submitSession(currentAct.id, {
                duration_seconds: result.duration,
                accuracy: result.accuracy,
                completed: result.completed
            });
        }

        // 2. Advance State
        if (currentIndex >= activities.length - 1) {
            setViewState("summary");
        } else {
            setViewState("interstitial");
        }
    };

    const advanceToNext = () => {
        setCurrentIndex(i => i + 1);
        setViewState("intro");
    };

    if (!activities || activities.length === 0) {
        return (
            <Card className="p-8 text-center">
                <h2 className="text-xl font-bold">You are all caught up!</h2>
                <p className="mt-2 text-muted-foreground">Check back tomorrow for more customized learning.</p>
                <Button className="mt-5" onClick={onFinish}>Return to Dashboard</Button>
            </Card>
        );
    }

    if (viewState === "intro") {
        return (
            <Card className="p-8 text-center max-w-lg mx-auto mt-10">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <Badge className="mb-2 uppercase tracking-widest">{currentAct?.activity_type}</Badge>
                <h2 className="text-2xl font-bold mb-2">{currentAct?.title}</h2>
                <p className="text-muted-foreground mb-8">
                    Complete this activity to earn {currentAct?.rewards?.xp || 10} XP!
                </p>
                <Button size="lg" className="w-full" onClick={() => setViewState("playing")}>
                    Start Activity
                </Button>
            </Card>
        );
    }

    if (viewState === "summary") {
        const totalXP = activities.reduce((acc, act) => acc + (act.rewards?.xp || 10), 0);
        return (
            <Card className="p-10 text-center max-w-lg mx-auto mt-10 overflow-hidden relative">
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                <h2 className="font-display text-4xl font-bold mb-4">Module Complete!</h2>
                <p className="text-lg text-muted-foreground mb-6">Incredible dedication. You've earned:</p>

                <div className="flex justify-center items-center gap-6 mb-8">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-accent-soft text-accent flex flex-col items-center justify-center mb-2 mx-auto">
                            <Star className="w-6 h-6 mb-1" />
                        </div>
                        <p className="font-bold text-xl">+{totalXP} XP</p>
                    </div>

                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary-soft text-primary flex flex-col items-center justify-center mb-2 mx-auto">
                            <Flame className="w-6 h-6 mb-1" />
                        </div>
                        <p className="font-bold text-xl">+1 Streak</p>
                    </div>
                </div>

                <Button size="lg" onClick={onFinish} className="w-full gap-2 text-lg">
                    Continue <ArrowRight className="w-5 h-5" />
                </Button>
            </Card>
        );
    }

    if (viewState === "interstitial") {
        return (
            <Card className="p-8 text-center max-w-sm mx-auto mt-20">
                <h2 className="text-xl font-bold text-success mb-2">Great job!</h2>
                <p className="text-muted-foreground mb-6">Activity complete. Let's move to the next one.</p>
                <Button onClick={advanceToNext} className="w-full">Next Activity</Button>
            </Card>
        );
    }

    // PLATFORM DISPATCHER
    // This handles mapping "activity_type" to the correct React Component (e.g. from components/questions/)
    // The QuestionRenderer can be extended since we built it to support dynamic shapes.

    return (
        <div className="max-w-2xl mx-auto space-y-6 mt-6">
            <div className="flex items-center gap-4">
                <Progress value={progressPct} className="h-3 flex-1" />
                <span className="text-sm font-bold opacity-75">{currentIndex + 1} / {activities.length}</span>
            </div>

            {/* Dynamic Pluggable Game Engine Mount */}
            <Card className="p-6">
                {currentAct.activity_type === "speaking" || currentAct.activity_type === "mcq" ? (
                    <QuestionRenderer
                        question={{
                            id: currentAct.id,
                            question_type: currentAct.activity_type as any,
                            prompt: currentAct.content?.prompt || "Complete the task",
                            options: currentAct.content?.options || [],
                            reference_text: currentAct.content?.reference_text,
                            skill: "listening",
                            difficulty: 1,
                        }}
                        selected={null}
                        onSelect={() => {
                            handleNext({
                                accuracy: 1.0,
                                completed: true,
                                duration: 30
                            });
                        }}
                    />
                ) : (
                    <div className="text-center p-8">
                        <p className="text-muted-foreground mb-4">Fallback renderer for activity: <strong>{currentAct.activity_type}</strong></p>
                        <Button onClick={() => handleNext({ accuracy: 1.0, completed: true, duration: 10 })}>Simulate Completion</Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
