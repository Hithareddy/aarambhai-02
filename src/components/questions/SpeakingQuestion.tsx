import { useEffect, useState } from "react";
import type { SpeakingQuestion as SQ } from "@/lib/api/assessment";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, RotateCcw, AlertTriangle, CheckCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  question: SQ;
  disabled?: boolean;
  onSubmit: (response: {
    transcript: string;
    durationMs: number;
    retries?: number;
    confidence?: number;
  }) => void;
}

type RecState = "idle" | "requesting" | "recording" | "done" | "error";

export function SpeakingQuestion({ question, disabled, onSubmit }: Props) {
  const [state, setState] = useState<RecState>("idle");
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const supported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  useEffect(() => {
    setState("idle");
    setTranscript("");
    setDuration(0);
    setRetryCount(0);
    setError(null);
  }, [question.id]);

  const start = async () => {
    setError(null);
    if (!supported) {
      setState("error");
      setError("Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    setState("requesting");
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setState("recording");
      
      // Simple speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = question.language;
        recognition.continuous = false;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          const last = event.results.length - 1;
          const current = event.results[last];
          if (current.isFinal) {
            setTranscript(current[0].transcript);
            setDuration(Date.now() - (startTime || Date.now()));
            setState("done");
          } else {
            setTranscript(current[0].transcript);
          }
        };
        
        recognition.onerror = (event: any) => {
          setError(event.error);
          setState("error");
        };
        
        recognition.onend = () => {
          if (state === "recording") {
            setState("done");
          }
        };
        
        const startTime = Date.now();
        recognition.start();
      }
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Failed to initialize microphone stream.");
      setState("error");
    }
  };

  const stop = () => {
    // Stop recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      // Note: Web Speech API doesn't have a direct stop method, we rely on onend
      setState("done");
    }
  };

  const retry = () => {
    setTranscript("");
    setDuration(0);
    setError(null);
    setState("idle");
    setRetryCount((prev) => prev + 1);
  };

  const submit = () => {
    onSubmit({
      transcript: transcript.trim(),
      durationMs: duration,
      retries: retryCount,
      confidence: 0.9,
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-lg font-semibold">{question.instruction}</p>

      <Card className="p-6">
        <div className="bg-primary/10 border border-primary/20 p-5 rounded-lg mb-6">
          <span className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
            Read this phrase aloud:
          </span>
          <p className="text-xl font-semibold text-primary-foreground">
            "{question.targetPhrase}"
          </p>
        </div>

        {!supported && (
          <Alert variant="destructive">
            <AlertTriangle size={18} />
            <AlertDescription>
              Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.
            </AlertDescription>
          </Alert>
        )}

        <div
          className={`flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed min-h-[100px] text-center ${
            state === "recording" ? "bg-green-50 border-green-300" : "bg-muted border-border"
          }`}
        >
          {state === "recording" ? (
            <>
              <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center animate-pulse">
                <Mic size={20} />
              </div>
              <p className="font-semibold text-green-700">Listening & recording... Speak clearly.</p>
            </>
          ) : state === "requesting" ? (
            <p className="font-medium text-muted-foreground">
              Configuring audio connection permissions...
            </p>
          ) : state === "done" ? (
            <div className="flex items-center gap-2 text-primary font-semibold">
              <CheckCircle size={20} className="text-green-500" />
              <span>Speech captured successfully.</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Press Start Speaking, allow mic access, and read the phrase.
            </p>
          )}
        </div>

        {transcript && (
          <div className="bg-muted border border-border rounded-lg p-4">
            <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Recognized Speech Draft
            </span>
            <p className="text-base font-medium">{transcript}</p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle size={18} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-3">
          {state === "recording" ? (
            <Button onClick={stop} disabled={disabled} variant="secondary" className="gap-2">
              <Square size={16} fill="currentColor" />
              Stop Recording
            </Button>
          ) : state === "done" || state === "error" ? (
            <>
              <Button onClick={retry} disabled={disabled} variant="secondary" className="gap-2">
                <RotateCcw size={16} />
                Retry Speech
              </Button>
              <Button onClick={submit} disabled={disabled} className="gap-2">
                <Check size={16} />
                Submit Answer
              </Button>
            </>
          ) : (
            <>
              <Button onClick={start} disabled={disabled || state === "requesting"} className="gap-2">
                <Mic size={16} />
                Start Speaking
              </Button>
              <Button
                onClick={submit}
                disabled={disabled}
                variant="secondary"
                title="Submit blank response if microphone is unavailable or unsupported"
              >
                Skip Question
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
