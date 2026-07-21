/**
 * AudioPlayerWidget — Universal audio player for assessment questions.
 *
 * Handles three audio_url formats transparently:
 *   "tts:<phrase>"  → browser Web Speech API (development / TTS fallback)
 *   "https://..."   → native <audio> element (production hosted files)
 *   null / undefined → renders nothing
 *
 * UPGRADE PATH: replace any "tts:<phrase>" value in the database with a real
 * hosted audio URL — this component automatically uses <audio> with no code
 * changes required.
 */
import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Square } from "lucide-react";

export interface AudioPlayerWidgetProps {
    audioUrl: string | null | undefined;
}

// ── TTS Player ────────────────────────────────────────────────────────────────

function TTSPlayer({ phrase }: { phrase: string }) {
    const [speaking, setSpeaking] = useState(false);
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        setSupported("speechSynthesis" in window);
        return () => {
            // Stop speech when question changes
            if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        };
    }, []);

    const speak = () => {
        if (!("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(phrase);
        utter.lang = "en-IN";
        utter.rate = 0.9;
        utter.onstart = () => setSpeaking(true);
        utter.onend = () => setSpeaking(false);
        utter.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utter);
    };

    const stop = () => {
        window.speechSynthesis.cancel();
        setSpeaking(false);
    };

    if (!supported) {
        return (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                <VolumeX size={16} />
                <span>Audio not supported in this browser. Read the prompt carefully.</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <button
                type="button"
                onClick={speaking ? stop : speak}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
                {speaking ? (
                    <>
                        <Square size={14} className="fill-current" />
                        Stop
                    </>
                ) : (
                    <>
                        <Play size={14} className="fill-current" />
                        Play audio
                    </>
                )}
            </button>
            <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">
                    Tap to hear the audio for this question
                </span>
                {speaking && (
                    <span className="text-xs text-primary animate-pulse">Playing…</span>
                )}
            </div>
            <Volume2 size={18} className="ml-auto text-muted-foreground" />
        </div>
    );
}

// ── Hosted Audio Player ────────────────────────────────────────────────────────

function HostedAudioPlayer({ url }: { url: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);

    return (
        <div className="flex flex-col gap-1 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <span className="text-xs font-medium text-muted-foreground mb-1">
                Listen to the audio, then answer:
            </span>
            <audio
                ref={audioRef}
                controls
                src={url}
                className="w-full h-10"
                onError={() => {
                    if (audioRef.current) {
                        audioRef.current.parentElement!.innerHTML =
                            '<p class="text-xs text-destructive">Audio file could not be loaded.</p>';
                    }
                }}
            >
                Your browser does not support audio playback.
            </audio>
        </div>
    );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function AudioPlayerWidget({ audioUrl }: AudioPlayerWidgetProps) {
    if (!audioUrl) return null;

    if (audioUrl.startsWith("tts:")) {
        const phrase = audioUrl.slice(4).trim();
        return <TTSPlayer phrase={phrase} />;
    }

    if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
        return <HostedAudioPlayer url={audioUrl} />;
    }

    // Unknown format — show as plain TTS text
    return <TTSPlayer phrase={audioUrl} />;
}
