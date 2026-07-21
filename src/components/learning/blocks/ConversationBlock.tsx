import * as React from "react";
import { Button } from "@/components/ui/button";
import { Bot, User, ArrowRight } from "lucide-react";
import type { BlockProps } from "./types";
import { cn } from "@/lib/utils";

interface DialogueLine {
    speaker: "ai" | "learner";
    text: string;
}

export const ConversationBlock: React.FC<BlockProps> = ({ block, onComplete }) => {
    const dialogue: DialogueLine[] = block.content.dialogue || [];
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isFinished, setIsFinished] = React.useState(false);

    const handleNext = () => {
        if (currentIndex < dialogue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
            if (onComplete) onComplete();
        }
    };

    if (dialogue.length === 0) {
        return <div className="p-4 text-destructive">Conversation content missing.</div>;
    }

    return (
        <div className="mb-6 p-6 rounded-lg border bg-card shadow-sm flex flex-col h-full max-h-[600px] overflow-hidden">
            <h3 className="text-xl font-bold mb-6 text-primary flex items-center justify-between">
                <span>Conversation Practice</span>
                <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {currentIndex + 1} / {dialogue.length}
                </span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
                {dialogue.slice(0, currentIndex + 1).map((line, idx) => {
                    const isAi = line.speaker === "ai";
                    const isLast = idx === currentIndex;
                    return (
                        <div
                            key={idx}
                            className={cn(
                                "flex gap-3",
                                isAi ? "justify-start" : "justify-end",
                                isLast ? "animate-in fade-in slide-in-from-bottom-4 duration-500" : "opacity-80"
                            )}
                        >
                            {isAi && (
                                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot className="h-4 w-4" />
                                </div>
                            )}
                            <div className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-3",
                                isAi
                                    ? "bg-muted text-foreground rounded-tl-sm"
                                    : "bg-primary text-primary-foreground rounded-tr-sm"
                            )}>
                                <p className="text-md">{line.text}</p>
                            </div>
                            {!isAi && (
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-1">
                                    <User className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-4 border-t">
                {isFinished ? (
                    <Button variant="secondary" disabled className="w-full sm:w-auto text-emerald-500">
                        Conversation Complete✓
                    </Button>
                ) : (
                    <Button onClick={handleNext} className="w-full sm:w-auto flex items-center gap-2">
                        {dialogue[currentIndex].speaker === "learner" ? "I said it!" : "Continue"}
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};
