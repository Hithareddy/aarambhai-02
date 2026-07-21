import { useState, useEffect } from "react";
import { HelpCircle, Volume2, Info, RefreshCw } from "lucide-react";
import { type Question } from "@/lib/api/assessment";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/hooks/use-language";

export interface HelpWidgetProps {
    question: Question;
}

const INSTRUCTIONS_BY_TYPE: Record<string, string> = {
    mcq: "Select the one correct option below.",
    true_false: "Decide if the statement is true or false.",
    fill_blank: "Choose the word that correctly fills the blank space in the text.",
    arrange: "Select the words in the correct order to form a sentence.",
    match: "Find the correct matching pair for the given item.",
    comprehension: "Read the passage carefully, then select the best answer from the options.",
    image_mcq: "Look at the image carefully, then select the best answer.",
};

export function HelpWidget({ question }: HelpWidgetProps) {
    const { t } = useLanguage();
    const [showInstructions, setShowInstructions] = useState(false);

    // When question changes, reset instructions
    useEffect(() => {
        setShowInstructions(false);
    }, [question.id]);

    const speakText = (text: string) => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = "en-IN"; // Target language (Indian English)
            utter.rate = 0.9;
            window.speechSynthesis.speak(utter);
        }
    };

    const readQuestion = () => {
        speakText(question.prompt);
    };

    const repeatAudio = () => {
        if (!question.audio_url) return;

        if (question.audio_url.startsWith("tts:")) {
            speakText(question.audio_url.slice(4).trim());
        } else {
            const audio = new Audio(question.audio_url);
            audio.play().catch((err) => {
                console.error("Failed to play audio in Help widget:", err);
            });
        }
    };

    const fallbackInstruction = t("help.defaultInst") || "Please answer the question below.";
    // Support localization if exact type keys are defined in the translations, otherwise fallback to English defaults
    const instructionText = t(`help.inst_${question.question_type}`) || INSTRUCTIONS_BY_TYPE[question.question_type] || fallbackInstruction;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                    <HelpCircle size={18} />
                    <span>{t("help.button") || "Help"}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 shadow-xl" align="end" sideOffset={8}>
                <div className="space-y-4">
                    <h4 className="font-semibold text-sm">
                        {t("help.title") || "Need some help?"}
                    </h4>

                    <div className="flex flex-col gap-2">
                        <Button variant="secondary" size="sm" className="justify-start gap-3 w-full font-medium" onClick={readQuestion}>
                            <Volume2 size={16} className="text-primary/70" />
                            {t("help.readQuestion") || "Read question again"}
                        </Button>

                        {question.audio_url && (
                            <Button variant="secondary" size="sm" className="justify-start gap-3 w-full font-medium" onClick={repeatAudio}>
                                <RefreshCw size={16} className="text-primary/70" />
                                {t("help.repeatAudio") || "Repeat audio"}
                            </Button>
                        )}

                        <Button
                            variant="secondary"
                            size="sm"
                            className="justify-start gap-3 w-full font-medium"
                            onClick={() => setShowInstructions(true)}
                        >
                            <Info size={16} className="text-primary/70" />
                            {t("help.explainInst") || "Explain instructions"}
                        </Button>
                    </div>

                    {showInstructions && (
                        <Alert className="bg-primary/5 border-primary/20">
                            <Info className="h-4 w-4 text-primary" />
                            <AlertDescription className="text-sm">
                                {instructionText}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
