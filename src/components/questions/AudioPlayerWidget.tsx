/**
 * AudioPlayerWidget — Universal audio player for assessment questions.
 *
 * Handles three audio_url formats transparently:
 *   "tts:<phrase>"  → browser Web Speech API (development / TTS fallback)
 *   "https://..."   → native <audio> element (production hosted files)
 *   null / undefined → renders nothing
 */
import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Square } from "lucide-react";
import { resolveBrowserVoice } from "@/lib/audio-utils";

export interface AudioPlayerWidgetProps {
    audioUrl?: string | null;
    audioScript?: string | null;
}

// ── TTS Player ────────────────────────────────────────────────────────────────

function TTSPlayer({ phrase }: { phrase: string }) {
    const [speaking, setSpeaking] = useState(false);
    const [supported, setSupported] = useState(true);

    useEffect(() => {
        setSupported("speechSynthesis" in window);
        return () => {
            if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        };
    }, []);

    const speak = () => {
        if (!("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();

        const utter = new SpeechSynthesisUtterance(phrase);
        const voicePref = localStorage.getItem("voice_preference") || "";
        const speed = parseFloat(localStorage.getItem("playback_speed") || "0.9");

        utter.rate = speed;

        const { voice, exactMatch } = resolveBrowserVoice(voicePref, "en-IN");

        console.table({
            "Component": "AudioPlayerWidget (TTS)",
            "Selected Voice": voicePref,
            "Resolved Browser Voice": voice ? voice.name : "None",
            "Exact Match": exactMatch,
            "Playback Speed": utter.rate,
            "Using Recorded Audio": false,
            "Using TTS": true,
            "Target Phrase snippet": phrase.substring(0, 15)
        });

        if (voice) {
            utter.voice = voice;
            utter.lang = voice.lang;
        }

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

    useEffect(() => {
        if (audioRef.current) {
            const speed = parseFloat(localStorage.getItem("playback_speed") || "1");
            audioRef.current.playbackRate = speed;

            console.table({
                "Component": "AudioPlayerWidget (Hosted)",
                "Playback Speed": speed,
                "Using Recorded Audio": true,
                "Using TTS": false,
                "Audio URL": url
            });
        }
    }, [url]);

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

export function AudioPlayerWidget({ audioUrl, audioScript }: AudioPlayerWidgetProps) {
    if (!audioUrl && !audioScript) return null;

    if (audioUrl) {
        if (audioUrl.startsWith("tts:")) {
            const phrase = audioUrl.slice(4).trim();
            return <TTSPlayer phrase={phrase} />;
        }

        if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://") || audioUrl.startsWith("/")) {
            return <HostedAudioPlayer url={audioUrl} />;
        }
    }

    if (audioScript) {
        return <TTSPlayer phrase={audioScript} />;
    }

    return null;
}
