import { useEffect, useState } from "react";
import type { ListeningQuestion as LQ } from "@/lib/api/assessment";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Volume2, RotateCcw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  question: LQ;
  disabled?: boolean;
  onSubmit: (
    selectedIndex: number,
    interaction: { audioPlayed: boolean; playCount: number; playCompleted: boolean },
  ) => void;
}

export function ListeningQuestion({ question, disabled, onSubmit }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [playCompleted, setPlayCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(null);
    setHasPlayed(false);
    setPlayCount(0);
    setPlayCompleted(false);
    setError(null);
  }, [question.id]);

  const play = () => {
    // Simple TTS using Web Speech API
    if ("speechSynthesis" in window) {
      setError(null);
      setPlayCount((c) => c + 1);
      setPlaying(true);

      const utterance = new SpeechSynthesisUtterance(question.audioText);
      utterance.lang = question.language;
      utterance.onend = () => {
        setPlaying(false);
        setHasPlayed(true);
        setPlayCompleted(true);
      };
      utterance.onerror = () => {
        setPlaying(false);
        setError("Failed to play audio");
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setError("Text-to-speech is not supported in this browser");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-lg font-semibold">{question.instruction}</p>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              playing ? "bg-primary/10" : "bg-muted"
            }`}
          >
            <Volume2 size={24} className={playing ? "animate-pulse text-primary" : "text-muted-foreground"} />
          </div>

          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-3">
              {playing
                ? "Playing audio clip..."
                : hasPlayed
                  ? "Audio completed. Press Replay if you need to listen again."
                  : "Press Play to listen to the audio instruction."}
            </p>

            <Button
              onClick={play}
              disabled={playing || disabled}
              variant={hasPlayed ? "outline" : "default"}
              className="gap-2"
            >
              {hasPlayed ? <RotateCcw size={16} /> : <Play size={16} fill="currentColor" />}
              {playing ? "Playing..." : hasPlayed ? "Replay Audio" : "Play Audio"}
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle size={18} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Select the correct statement:</h3>

        <div className="space-y-2">
          {question.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => setSelected(i)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selected === i
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() =>
            selected != null &&
            onSubmit(selected, { audioPlayed: hasPlayed, playCount, playCompleted })
          }
          disabled={selected == null || disabled}
          size="lg"
        >
          Submit Answer
        </Button>
      </div>
    </div>
  );
}
