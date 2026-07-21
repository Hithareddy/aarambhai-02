import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Play, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/hooks/use-language";

export interface VoiceRecorderWidgetProps {
    maxDurationSeconds?: number;
    onRecordingComplete: (blob: Blob) => void;
    disabled?: boolean;
}

export function VoiceRecorderWidget({
    maxDurationSeconds = 30,
    onRecordingComplete,
    disabled = false,
}: VoiceRecorderWidgetProps) {
    const { t } = useLanguage();

    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Setup unmount cleanup
    useEffect(() => {
        return () => {
            stopTimer();
            stopRecordingImmediate();
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle auto-stop when hitting max duration
    useEffect(() => {
        if (isRecording && recordingSeconds >= maxDurationSeconds) {
            stopRecording();
        }
    }, [isRecording, recordingSeconds, maxDurationSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

    const startTimer = useCallback(() => {
        setRecordingSeconds(0);
        timerRef.current = setInterval(() => {
            setRecordingSeconds((prev) => prev + 1);
        }, 1000);
    }, []);

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startRecording = async () => {
        setError(null);
        setAudioUrl(null);
        setAudioBlob(null);
        audioChunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
                const audioUrl = URL.createObjectURL(audioBlob);
                setAudioBlob(audioBlob);
                setAudioUrl(audioUrl);
                onRecordingComplete(audioBlob);

                // Stop all tracks to release microphone
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            startTimer();
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError(
                t("assessmentQuiz.micError") ||
                "Microphone access denied or unavailable. Please check your browser permissions."
            );
            setIsRecording(false);
        }
    };

    const stopRecordingImmediate = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    const stopRecording = () => {
        stopTimer();
        stopRecordingImmediate();
        setIsRecording(false);
    };

    const resetRecording = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setAudioBlob(null);
        setRecordingSeconds(0);
        setError(null);
    };

    const togglePlayback = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(e => console.error(e));
            setIsPlaying(true);
        }
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    // Format MM:SS
    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
        const s = (totalSeconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <div className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-background/50">
            {error && (
                <Alert variant="destructive" className="mb-4 w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Audio Element for Playback */}
            {audioUrl && (
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={handleAudioEnded}
                    className="hidden"
                />
            )}

            <div className="flex flex-col items-center gap-4">
                {/* State 1: Ready to Record */}
                {!isRecording && !audioBlob && (
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-sm text-muted-foreground font-medium mb-1">
                            {t("assessmentQuiz.maxDuration") || "Max duration"}: {formatTime(maxDurationSeconds)}
                        </div>
                        <Button
                            size="lg"
                            className="rounded-full w-16 h-16 bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 shadow-sm"
                            onClick={startRecording}
                            disabled={disabled}
                        >
                            <Mic size={28} />
                        </Button>
                        <span className="text-sm font-semibold">
                            {t("assessmentQuiz.tapToRecord") || "Tap to Start Recording"}
                        </span>
                    </div>
                )}

                {/* State 2: Actively Recording */}
                {isRecording && (
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-2xl font-mono text-primary font-bold tracking-widest animate-pulse">
                            {formatTime(recordingSeconds)}
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">
                            / {formatTime(maxDurationSeconds)}
                        </div>
                        <Button
                            size="lg"
                            variant="destructive"
                            className="rounded-full w-16 h-16 shadow-md"
                            onClick={stopRecording}
                        >
                            <Square size={24} className="fill-current" />
                        </Button>
                        <span className="text-sm font-semibold text-destructive animate-pulse">
                            {t("assessmentQuiz.recording") || "Recording..."}
                        </span>
                    </div>
                )}

                {/* State 3: Recorded and Ready for Playback/Submit */}
                {!isRecording && audioBlob && (
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="flex gap-4 items-center">
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-12 h-12 rounded-full text-primary"
                                onClick={togglePlayback}
                            >
                                {isPlaying ? <Square size={20} className="fill-current" /> : <Play size={20} className="fill-current" />}
                            </Button>

                            <div className="text-xl font-mono font-bold">
                                {formatTime(recordingSeconds)}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-12 h-12 rounded-full text-muted-foreground hover:text-destructive"
                                onClick={resetRecording}
                                disabled={disabled} // don't allow reset while submitting
                            >
                                <RefreshCw size={20} />
                            </Button>
                        </div>

                        {disabled && (
                            <div className="flex items-center gap-2 text-sm text-primary font-medium mt-2">
                                <Loader2 size={16} className="animate-spin" />
                                {t("assessmentQuiz.analyzingSpeech") || "Analyzing speech..."}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
