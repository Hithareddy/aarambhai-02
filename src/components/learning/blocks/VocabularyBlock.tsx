import * as React from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle } from "lucide-react";
import type { BlockProps } from "./types";

export const VocabularyBlock: React.FC<BlockProps> = ({ block, onComplete }) => {
    const [learned, setLearned] = React.useState(false);

    const handleMarkAsLearned = () => {
        setLearned(true);
        if (onComplete) onComplete();
    };

    const handlePlayAudio = () => {
        if (block.content.audio) {
            const audio = new Audio(block.content.audio);
            audio.play().catch(e => console.error("Audio playback error:", e));
        }
    };

    return (
        <div className="mb-6 bg-card border rounded-lg p-6 flex flex-col shadow-sm transition-all relative overflow-hidden">
            {learned && (
                <div className="absolute top-0 right-0 p-4 text-emerald-500">
                    <CheckCircle className="h-6 w-6" />
                </div>
            )}

            <div className="flex items-center gap-4 mb-4">
                <h3 className="text-3xl font-bold text-primary">{block.content.word}</h3>
                {block.content.audio && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                        onClick={handlePlayAudio}
                        title="Play pronunciation"
                    >
                        <Play className="h-4 w-4 fill-current" />
                    </Button>
                )}
            </div>

            {block.content.pronunciation && (
                <p className="text-sm font-mono text-muted-foreground mb-4 bg-muted inline-block w-fit px-2 py-1 rounded">
                    /{block.content.pronunciation}/
                </p>
            )}

            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-sm text-foreground/80 uppercase mb-1">Meaning</h4>
                    <p className="text-card-foreground text-lg">{block.content.definition || block.content.meaning}</p>
                </div>

                {block.content.example && (
                    <div className="bg-muted/50 p-4 rounded-md border-l-4 border-primary">
                        <h4 className="font-semibold text-xs text-muted-foreground uppercase mb-1">Example</h4>
                        <p className="text-foreground italic">"{block.content.example}"</p>
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-end">
                <Button
                    onClick={handleMarkAsLearned}
                    disabled={learned}
                    variant={learned ? "secondary" : "default"}
                    className="w-full sm:w-auto"
                >
                    {learned ? "Learned" : "Mark as Learned"}
                </Button>
            </div>
        </div>
    );
};
