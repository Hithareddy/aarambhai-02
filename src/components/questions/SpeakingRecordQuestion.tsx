import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Mic, Volume2, Square, Play, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';

interface SpeakingRecordQuestionProps {
  questionText: string;
  image?: string;
  audioText?: string;
  onSelect: (val: string) => void;
  submitting?: boolean;
}

export function SpeakingRecordQuestion({
  questionText,
  image,
  audioText,
  onSelect,
  submitting = false,
}: SpeakingRecordQuestionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const startRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setRecorded(true);
      onSelect('SpokenRecordingFinished');
    }, 2500);
  };

  const playRecordedSample = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(audioText || 'Sample recorded speech phrase.');
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-xl mx-auto animate-in fade-in duration-300">
      <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 text-xs font-extrabold px-3 py-1">
        Speaking Activity
      </Badge>

      <h3 className="text-2xl font-black text-center text-foreground">{questionText}</h3>

      {/* Large Image Prompt */}
      {image && (
        <Card className="w-56 h-56 sm:w-64 sm:h-64 bg-white dark:bg-card border-4 border-rose-500/20 rounded-3xl shadow-lg flex items-center justify-center p-4">
          <img src={image} alt="Speaking prompt" className="w-full h-full object-contain drop-shadow" />
        </Card>
      )}

      {/* Large Microphone Recorder Control */}
      <div className="flex flex-col items-center space-y-4 w-full">
        {!recorded ? (
          <button
            onClick={startRecording}
            disabled={isRecording || submitting}
            className={`h-24 w-24 rounded-full flex items-center justify-center text-white shadow-xl transition-transform ${
              isRecording
                ? 'bg-rose-600 animate-pulse scale-110 ring-8 ring-rose-500/30'
                : 'bg-rose-500 hover:bg-rose-600 hover:scale-105 active:scale-95'
            }`}
          >
            {isRecording ? <Square className="h-10 w-10 fill-current" /> : <Mic className="h-10 w-10" />}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={playRecordedSample}
              className="h-14 rounded-2xl font-bold gap-2 text-rose-600 border-rose-500/30"
            >
              <Play className="h-5 w-5 fill-current" /> Replay Voice
            </Button>
            <div className="text-xs font-extrabold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-5 w-5" /> Voice Recorded!
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground font-bold">
          {isRecording ? 'Listening... Speak out loud now!' : recorded ? 'Recording completed. Tap Next below.' : 'Tap microphone button to start recording.'}
        </p>
      </div>
    </div>
  );
}
