import * as React from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle2 } from "lucide-react";
import { VoiceRecorderWidget } from "@/components/questions/VoiceRecorderWidget";
import type { BlockProps } from "./types";

export const PronunciationBlock: React.FC<BlockProps> = ({ block, onComplete }) => {
    const [step, setStep] = React.useState<"listen" | "record" | "evaluated">("listen");
    const [transcript, setTranscript] = React.useState<string | null>(null);

    const handleListen = () => {
        if (block.content.audio) {
            const audio = new Audio(block.content.audio);
            audio.play().catch(e => console.error("Audio playback error:", e));
        }
        // Unlock recording step
        setStep("record");
    };

    const handleRecordingComplete = async (blob: Blob) => {
        // In a real application, submit the blob to an STT endpoint here
        // For the practice block, we emulate successful transcription evaluation

        // Emulated evaluation delay
        setTimeout(() => {
            setTranscript("Evaluation complete (Simulated Practice STT)");
            setStep("evaluated");
            if (onComplete) onComplete();
        }, 1500);
    };

    return (
        <div className="mb-6 p-6 rounded-lg border bg-card shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-primary">Pronunciation Practice</h3>

            <div className="bg-muted p-4 rounded-md mb-6 italic text-center text-lg">
                "{block.content.text}"
            </div>

            <div className="flex flex-col items-center gap-6">
                {step === "listen" && (
                    <Button
                        size="lg"
                        onClick={handleListen}
                        className="w-full sm:w-auto h-16 rounded-full px-8 text-lg font-semibold shadow-md inline-flex gap-2"
                    >
                        <Play className="h-6 w-6" /> Listen First
                    </Button>
                )}

                {step === "record" && (
                    <div className="w-full animation-fade-in text-center flex flex-col items-center">
                        <p className="text-sm font-semibold uppercase text-muted-foreground mb-4">Now it's your turn</p>
                        <div className="w-full max-w-sm">
                            <VoiceRecorderWidget
                                maxDurationSeconds={15}
                                onRecordingComplete={handleRecordingComplete}
                                disabled={false}
                            />
                        </div>
                    </div>
                )}

                {step === "evaluated" && (
                    <div className="w-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 p-4 rounded-md border border-emerald-200 dark:border-emerald-800/50 flex flex-col items-center">
                        <CheckCircle2 className="h-8 w-8 mb-2 text-emerald-500" />
                        <h4 className="font-bold text-lg mb-1">Excellent!</h4>
                        <p className="text-sm opacity-80">{transcript}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
