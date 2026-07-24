import { useState, useEffect } from "react";
import { HelpCircle, Volume2, Info, RefreshCw, Headphones, Check } from "lucide-react";
import { type Question } from "@/lib/api/assessment";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/hooks/use-language";
import { resolveBrowserVoice, playTestVoice } from "@/lib/audio-utils";

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
    const [showVoices, setShowVoices] = useState(false);

    const initialVoice = typeof window !== "undefined" ? (localStorage.getItem("voice_preference") || "") : "";
    const initialSpeed = typeof window !== "undefined" ? (localStorage.getItem("playback_speed") || "1") : "1";
    const [selectedVoice, setSelectedVoice] = useState(initialVoice);
    const [selectedSpeed, setSelectedSpeed] = useState(initialSpeed);
    const [voiceWarning, setVoiceWarning] = useState<string | null>(null);

    const learnLangCode = typeof window !== "undefined" ? (localStorage.getItem("target_language") || "en") : "en";
    let voicesList: string[] = [];
    if (learnLangCode === "en") {
        voicesList = ["Indian English Female", "Indian English Male", "British English Female", "British English Male", "American English Female", "American English Male"];
    } else if (learnLangCode === "hi") {
        voicesList = ["Native Hindi Female", "Native Hindi Male"];
    } else if (learnLangCode === "te") {
        voicesList = ["Native Telugu Female", "Native Telugu Male"];
    } else {
        voicesList = ["Native Female", "Native Male"];
    }

    // When question changes, reset instructions
    useEffect(() => {
        setShowInstructions(false);
    }, [question.id]);

    useEffect(() => {
        if (!selectedVoice) {
            setVoiceWarning(null);
            return;
        }
        const { voice, exactMatch } = resolveBrowserVoice(selectedVoice, "en-IN");
        if (!exactMatch) {
            setVoiceWarning("This voice is unavailable on your device.");
        } else {
            setVoiceWarning(null);
        }
    }, [selectedVoice, showVoices]);

    const speakText = (text: string) => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = "en-IN"; // Target language (Indian English)
            utter.rate = parseFloat(localStorage.getItem("playback_speed") || "0.9");

            // Support voice selection in HelpWidget readQuestion fallback
            const voicePref = localStorage.getItem("voice_preference") || "";
            if (voicePref) {
                const { voice, exactMatch } = resolveBrowserVoice(voicePref, "en-IN");
                console.table({
                    "Component": "HelpWidget TTS",
                    "Selected Voice": voicePref,
                    "Resolved Browser Voice": voice ? voice.name : "None",
                    "Exact Match": exactMatch,
                    "Playback Speed": utter.rate
                });

                if (voice) {
                    utter.voice = voice;
                    utter.lang = voice.lang;
                }
            }
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
            audio.playbackRate = parseFloat(localStorage.getItem("playback_speed") || "1");

            // To emulate immediate reflection if it's a natively generated TTS blob,
            // we will let AudioPlayerWidget handle its own caching but for Help replay we just play it.
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
                        <Button
                            variant="secondary"
                            size="sm"
                            className="justify-start gap-3 w-full font-medium"
                            onClick={() => {
                                setShowVoices(!showVoices);
                                setShowInstructions(false);
                            }}
                        >
                            <Headphones size={16} className="text-primary/70" />
                            Audio Settings
                        </Button>
                    </div>

                    {showVoices && (
                        <div className="mt-4 pt-3 border-t">
                            <h5 className="text-xs font-semibold text-muted-foreground mb-2">Voice</h5>
                            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1 pb-1 mb-4">
                                {voicesList.map(vName => (
                                    <button
                                        key={vName}
                                        onClick={() => {
                                            setSelectedVoice(vName);
                                            if (typeof window !== "undefined") {
                                                localStorage.setItem("voice_preference", vName);
                                            }
                                        }}
                                        className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition ${selectedVoice === vName ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}
                                    >
                                        {vName}
                                        {selectedVoice === vName && <Check size={14} />}
                                    </button>
                                ))}
                            </div>

                            {voiceWarning && (
                                <p className="text-[10px] text-destructive leading-tight mb-4 px-1">
                                    {voiceWarning}
                                </p>
                            )}

                            <h5 className="text-xs font-semibold text-muted-foreground mb-2">Playback Speed</h5>
                            <div className="flex bg-muted rounded-md p-1 mb-4">
                                {["0.75", "1", "1.25"].map(speed => (
                                    <button
                                        key={speed}
                                        onClick={() => {
                                            setSelectedSpeed(speed);
                                            if (typeof window !== "undefined") {
                                                localStorage.setItem("playback_speed", speed);
                                            }
                                        }}
                                        className={`flex-1 text-xs py-1.5 rounded-sm transition ${selectedSpeed === speed ? 'bg-background shadow font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {speed}×
                                    </button>
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 mt-1 border-primary/20 text-primary hover:bg-primary/5"
                                onClick={() => playTestVoice(selectedVoice, selectedSpeed)}
                            >
                                <span>▶</span> Test Voice
                            </Button>
                        </div>
                    )}

                    {showInstructions && (
                        <Alert className="bg-primary/5 border-primary/20 mt-4">
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
