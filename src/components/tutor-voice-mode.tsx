/**
 * TutorVoiceMode — Phase 7C inline voice recording + TTS playback.
 *
 * Designed to sit INSIDE the chat input area (not a separate page).
 * State machine:
 *   idle → recording → processing → playing → idle
 *
 * Shows status indicators inline in the message area:
 *   🎤 Listening...
 *   📝 Transcribing...
 *   🤖 Thinking...
 *   🔊 Speaking...
 *
 * Reuses the same recording pattern as VoiceRecorderWidget.
 * Voice settings (gender, speed, autoplay) are stored in localStorage.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  Square,
  Loader2,
  Volume2,
  VolumeX,
  RefreshCw,
  X,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSendTutorVoiceMessage } from "@/lib/api/hooks";
import { getApiClient } from "@/lib/api/client";

// ─── Voice State Machine ──────────────────────────────────────────────────────

export type VoiceState =
  | "idle"
  | "recording"
  | "processing"  // STT → LLM → TTS
  | "playing"     // TTS audio is playing
  | "error";

// ─── Voice Settings (localStorage) ────────────────────────────────────────────

export interface VoiceSettings {
  voiceGender: "female" | "male";
  speakingSpeed: number;  // 0.5 - 2.0
  autoPlay: boolean;
}

const VOICE_SETTINGS_KEY = "aarambh_voice_settings";

export function getVoiceSettings(): VoiceSettings {
  try {
    const raw = localStorage.getItem(VOICE_SETTINGS_KEY);
    if (raw) return { ...defaultVoiceSettings(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultVoiceSettings();
}

export function saveVoiceSettings(settings: VoiceSettings): void {
  localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settings));
}

function defaultVoiceSettings(): VoiceSettings {
  return { voiceGender: "female", speakingSpeed: 1.0, autoPlay: true };
}

// ─── Voice Settings Panel ─────────────────────────────────────────────────────

export function VoiceSettingsPanel({
  settings,
  onChange,
  onClose,
}: {
  settings: VoiceSettings;
  onChange: (s: VoiceSettings) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full right-0 mb-2 w-64 rounded-xl border border-border bg-popover shadow-xl p-3 z-50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-foreground">🔊 Voice Settings</span>
        <button type="button" onClick={onClose} className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Voice Gender */}
      <div className="mb-3">
        <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">Voice</label>
        <div className="flex rounded-lg border border-border/60 overflow-hidden">
          {(["female", "male"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => { const next = { ...settings, voiceGender: g }; onChange(next); saveVoiceSettings(next); }}
              className={`flex-1 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                settings.voiceGender === g
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {g === "female" ? "♀ Female" : "♂ Male"}
            </button>
          ))}
        </div>
      </div>

      {/* Speaking Speed */}
      <div className="mb-3">
        <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1.5">
          Speed: {settings.speakingSpeed.toFixed(1)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={settings.speakingSpeed}
          onChange={(e) => {
            const next = { ...settings, speakingSpeed: parseFloat(e.target.value) };
            onChange(next);
            saveVoiceSettings(next);
          }}
          className="w-full h-1.5 accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
          <span>Slow</span>
          <span>Normal</span>
          <span>Fast</span>
        </div>
      </div>

      {/* Auto-play */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.autoPlay}
          onChange={(e) => {
            const next = { ...settings, autoPlay: e.target.checked };
            onChange(next);
            saveVoiceSettings(next);
          }}
          className="accent-primary h-3.5 w-3.5"
        />
        <span className="text-xs text-foreground">Auto-play tutor responses</span>
      </label>
    </div>
  );
}

// ─── Recording Controls (inline in input bar) ─────────────────────────────────

interface RecordingControlsProps {
  voiceState: VoiceState;
  recordingSeconds: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  onRetryRecording: () => void;
  onStopAudio: () => void;
  disabled: boolean;
  errorMsg: string | null;
  voiceSettings: VoiceSettings;
  onVoiceSettingsChange: (s: VoiceSettings) => void;
}

export function RecordingControls({
  voiceState,
  recordingSeconds,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onRetryRecording,
  onStopAudio,
  disabled,
  errorMsg,
  voiceSettings,
  onVoiceSettingsChange,
}: RecordingControlsProps) {
  const [showSettings, setShowSettings] = useState(false);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className="relative flex items-center gap-2 w-full">
      {/* Settings panel */}
      {showSettings && (
        <VoiceSettingsPanel
          settings={voiceSettings}
          onChange={onVoiceSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ── IDLE: Mic button ──────────────────────────────────────── */}
      {voiceState === "idle" && (
        <>
          <Button
            type="button"
            onClick={onStartRecording}
            disabled={disabled}
            className="h-10 w-10 rounded-full shrink-0 bg-gradient-to-br from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-sm cursor-pointer p-0"
            title="Tap to speak"
          >
            <Mic className="h-4.5 w-4.5" />
          </Button>
          <span className="text-xs text-muted-foreground flex-1">Tap 🎤 to speak to your tutor</span>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Voice settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </>
      )}

      {/* ── RECORDING: Waveform + timer + stop + cancel ──────────── */}
      {voiceState === "recording" && (
        <>
          {/* Cancel button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancelRecording}
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive cursor-pointer"
            title="Cancel recording"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Waveform visualization */}
          <div className="flex-1 flex items-center gap-1 px-2">
            <div className="flex items-center gap-0.5 flex-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-red-400"
                  style={{
                    height: `${Math.random() * 16 + 6}px`,
                    animation: `aarWaveBar 0.6s ease-in-out ${i * 0.05}s infinite alternate`,
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-mono text-red-500 font-bold ml-2 tabular-nums">
              {formatTime(recordingSeconds)}
            </span>
          </div>

          {/* Stop button */}
          <Button
            type="button"
            onClick={onStopRecording}
            className="h-10 w-10 rounded-full shrink-0 bg-red-500 hover:bg-red-600 text-white shadow-md cursor-pointer p-0"
            title="Stop recording"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        </>
      )}

      {/* ── PROCESSING: Status indicator ─────────────────────────── */}
      {voiceState === "processing" && (
        <div className="flex items-center gap-2 flex-1 px-2">
          <Loader2 className="h-4.5 w-4.5 animate-spin text-primary shrink-0" />
          <span className="text-xs text-primary font-medium animate-pulse">
            📝 Transcribing & 🤖 Thinking...
          </span>
        </div>
      )}

      {/* ── PLAYING: Audio is playing ────────────────────────────── */}
      {voiceState === "playing" && (
        <>
          <div className="flex items-center gap-2 flex-1 px-2">
            <Volume2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 animate-pulse" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              🔊 Speaking...
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onStopAudio}
            className="shrink-0 gap-1 text-xs h-8 cursor-pointer"
          >
            <VolumeX className="h-3.5 w-3.5" />
            Stop
          </Button>
        </>
      )}

      {/* ── ERROR: Retry / dismiss ───────────────────────────────── */}
      {voiceState === "error" && (
        <>
          <div className="flex items-center gap-1.5 flex-1 text-xs text-destructive px-1">
            <span>⚠️ {errorMsg || "Something went wrong"}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRetryRecording}
            className="shrink-0 gap-1 text-xs h-8 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </>
      )}

      {/* Waveform bar animation */}
      <style>{`
        @keyframes aarWaveBar {
          0%   { transform: scaleY(0.3); }
          100% { transform: scaleY(1.0); }
        }
      `}</style>
    </div>
  );
}

// ─── useVoiceTutor Hook ───────────────────────────────────────────────────────
// Encapsulates the full voice pipeline state machine.

const MAX_RECORDING_SECONDS = 30;

export function useVoiceTutor(
  conversationId: string,
  activeMode: string,
  onMicDenied?: () => void
) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(getVoiceSettings);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const voiceMutation = useSendTutorVoiceMessage();

  // Cleanup
  useEffect(() => {
    return () => {
      cleanupRecording();
      cleanupAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recording timer
  useEffect(() => {
    if (voiceState !== "recording") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((s) => {
        if (s + 1 >= MAX_RECORDING_SECONDS) {
          stopRecording();
          return MAX_RECORDING_SECONDS;
        }
        return s + 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceState]);

  const cleanupRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {};
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  };

  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    cleanupAudio();
    setErrorMsg(null);
    setRecordingSeconds(0);

    const mimeType =
      typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

    if (typeof MediaRecorder === "undefined") {
      setErrorMsg("Audio recording is not supported in this browser.");
      setVoiceState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (blob.size < 500) {
          setErrorMsg("Recording was too short. Please speak and try again.");
          setVoiceState("error");
          return;
        }

        processVoice(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setVoiceState("recording");
    } catch (err: any) {
      setVoiceState("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Microphone access denied. Please allow it in browser settings.");
        if (onMicDenied) onMicDenied();
      } else if (err.name === "NotFoundError") {
        setErrorMsg("No microphone found. Please connect one.");
      } else {
        setErrorMsg(`Microphone error: ${err.message || "unknown"}`);
      }
    }
  }, [conversationId, activeMode, voiceSettings, onMicDenied]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop(); // triggers onstop → processVoice
    }
  }, []);

  const cancelRecording = useCallback(() => {
    cleanupRecording();
    setVoiceState("idle");
    setRecordingSeconds(0);
  }, []);

  const processVoice = useCallback(
    async (audioBlob: Blob) => {
      setVoiceState("processing");

      try {
        const result = await voiceMutation.mutateAsync({
          conversationId,
          audioBlob,
          mode: activeMode,
          modeParams: {
            voice_gender: voiceSettings.voiceGender,
            speaking_speed: String(voiceSettings.speakingSpeed),
          },
        });

        // Play TTS if autoplay is on and token was returned
        if (voiceSettings.autoPlay && result.tutor_audio_token) {
          setVoiceState("playing");
          try {
            const audioUrl = await getApiClient().getVoiceAudio(result.tutor_audio_token);
            objectUrlRef.current = audioUrl;
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
              setVoiceState("idle");
              audioRef.current = null;
            };
            audio.onerror = () => {
              setVoiceState("idle");
              audioRef.current = null;
            };
            await audio.play();
          } catch {
            setVoiceState("idle");
          }
        } else {
          setVoiceState("idle");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Voice chat failed. Please try again.");
        setVoiceState("error");
      }
    },
    [conversationId, activeMode, voiceMutation, voiceSettings]
  );

  const stopAudio = useCallback(() => {
    cleanupAudio();
    setVoiceState("idle");
  }, []);

  const retryRecording = useCallback(() => {
    setErrorMsg(null);
    setVoiceState("idle");
  }, []);

  return {
    voiceState,
    recordingSeconds,
    errorMsg,
    voiceSettings,
    setVoiceSettings,
    startRecording,
    stopRecording,
    cancelRecording,
    stopAudio,
    retryRecording,
  };
}
