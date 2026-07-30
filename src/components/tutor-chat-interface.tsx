import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Loader2,
  PlusCircle,
  Edit2,
  AlertCircle,
  MessageSquare,
  Swords,
  Wrench,
  BookOpen,
  Zap,
  Mic,
  Keyboard,
  Volume2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTutorProfile,
  useTutorConversations,
  useCreateConversation,
  useTutorMessages,
  useSendTutorMessage,
} from "@/lib/api/hooks";
import { TutorSetupModal } from "./tutor-setup-modal";
import {
  RecordingControls,
  useVoiceTutor,
  getVoiceSettings,
} from "./tutor-voice-mode";
import { useLanguage } from "@/hooks/use-language";
import type { TutorConversation, TutorMessage } from "@/lib/api/types";

// ─── Practice Modes ───────────────────────────────────────────────────────────

type ModeKey = "free_talk" | "role_play" | "fix_sentence" | "explain_lesson" | "quick_practice";

interface PracticeMode {
  key: ModeKey;
  label: string;
  emoji: string;
  icon: React.ReactNode;
  placeholder: string;
}

const PRACTICE_MODES: PracticeMode[] = [
  {
    key: "free_talk",
    label: "Free Chat",
    emoji: "💬",
    icon: <MessageSquare className="h-3 w-3" />,
    placeholder: "Say anything — practice freely!",
  },
  {
    key: "role_play",
    label: "Role Play",
    emoji: "🎭",
    icon: <Swords className="h-3 w-3" />,
    placeholder: "Describe a scenario or respond in character…",
  },
  {
    key: "fix_sentence",
    label: "Fix My Sentence",
    emoji: "✍️",
    icon: <Wrench className="h-3 w-3" />,
    placeholder: "Type a sentence and I'll help correct it…",
  },
  {
    key: "explain_lesson",
    label: "Explain Lesson",
    emoji: "📖",
    icon: <BookOpen className="h-3 w-3" />,
    placeholder: "Ask me to explain a grammar rule or topic…",
  },
  {
    key: "quick_practice",
    label: "Quick Practice",
    emoji: "⚡",
    icon: <Zap className="h-3 w-3" />,
    placeholder: "Ready? I'll give you a quick exercise!",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function TutorChatInterface() {
  const { t } = useLanguage();
  const { data: profile, isLoading: isProfileLoading } = useTutorProfile();
  const { data: conversations, isLoading: isConvLoading } = useTutorConversations();
  const createConvMutation = useCreateConversation();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ModeKey>("free_talk");
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Voice tutor hook ──────────────────────────────────────────────────
  const voice = useVoiceTutor(activeConvId || "", activeMode, () => {
    setInputMode("text");
  });

  // Set initial active conversation
  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  const { data: messages, isLoading: isMessagesLoading } = useTutorMessages(
    activeConvId || undefined
  );
  const sendMessageMutation = useSendTutorMessage();

  // Scroll to bottom on new messages or voice state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessageMutation.isPending, voice.voiceState]);

  const currentMode = PRACTICE_MODES.find((m) => m.key === activeMode)!;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId || sendMessageMutation.isPending) return;

    const messageToSend = inputText.trim();
    setInputText("");
    setErrorMessage(null);

    sendMessageMutation.mutate(
      { conversationId: activeConvId, message: messageToSend, mode: activeMode },
      {
        onError: (err: any) => {
          setErrorMessage(
            err.message || "Unable to send message to AI Tutor right now. Please try again."
          );
        },
      }
    );
  };

  const handleNewConversation = () => {
    setErrorMessage(null);
    createConvMutation.mutate(undefined, {
      onSuccess: (newConv: TutorConversation) => {
        setActiveConvId(newConv.id);
      },
    });
  };

  if (isProfileLoading || isConvLoading) {
    return <Skeleton className="h-[600px] w-full rounded-2xl" />;
  }

  const tutorName = profile?.tutor_name || "Mira";
  const learningLang = profile?.learning_language || "en";
  const isBusy = sendMessageMutation.isPending || voice.voiceState === "processing" || voice.voiceState === "recording";

  return (
    <div className="flex flex-col h-[700px] rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 via-card to-accent/5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary font-bold">
              <Bot className="h-5 w-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-card" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-foreground truncate">
                🤖 {tutorName}
              </h2>
              <button
                type="button"
                onClick={() => setIsSetupOpen(true)}
                className="p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                title="Rename Tutor"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Your {learningLang.toUpperCase()} Learning Companion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewConversation}
            disabled={createConvMutation.isPending}
            className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
          >
            {createConvMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <PlusCircle className="h-3.5 w-3.5" />
                <span>New Session</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Practice Mode Toolbar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/40 bg-muted/30 overflow-x-auto scrollbar-none">
        {PRACTICE_MODES.map((mode) => {
          const isActive = activeMode === mode.key;
          return (
            <button
              key={mode.key}
              type="button"
              onClick={() => setActiveMode(mode.key)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0
                ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background/60 text-muted-foreground border border-border/60 hover:border-primary/40 hover:text-foreground hover:bg-background"
                }
              `}
              title={mode.label}
            >
              <span>{mode.emoji}</span>
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-muted/20">
        {isMessagesLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-3/4 rounded-2xl" />
            <Skeleton className="h-16 w-2/3 ml-auto rounded-2xl" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-30 text-primary" />
            <p className="text-sm font-semibold">Start practicing with {tutorName}!</p>
            <p className="text-xs mt-1 mb-4">Choose a mode above, then type or 🎤 speak.</p>
            {/* Mode hint cards */}
            <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto text-left">
              {PRACTICE_MODES.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setActiveMode(mode.key)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    activeMode === mode.key
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border/50 bg-background/40 text-muted-foreground hover:border-primary/30 hover:bg-background/60"
                  }`}
                >
                  <span className="text-base">{mode.emoji}</span>
                  <div>
                    <span className="font-semibold block">{mode.label}</span>
                    <span className="opacity-70">{mode.placeholder}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg: TutorMessage) => {
            const isTutor = msg.role === "tutor";
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  isTutor ? "mr-auto" : "ml-auto flex-row-reverse"
                }`}
              >
                {isTutor && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-bold mt-1">
                    🤖
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isTutor
                      ? "bg-card border border-border/60 text-foreground shadow-xs rounded-tl-xs"
                      : "bg-primary text-primary-foreground shadow-xs rounded-tr-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}

        {/* Voice Processing Status (inline in message area) */}
        {voice.voiceState === "processing" && (
          <div className="flex items-center gap-2.5 mr-auto max-w-[85%]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-bold mt-1">
              🤖
            </div>
            <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-xs rounded-tl-xs">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="animate-pulse">{tutorName} is thinking…</span>
              </div>
            </div>
          </div>
        )}

        {voice.voiceState === "playing" && (
          <div className="flex items-center gap-2.5 mr-auto max-w-[85%]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold mt-1">
              🔊
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs rounded-tl-xs">
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                <span>{tutorName} is speaking…</span>
              </div>
            </div>
          </div>
        )}

        {/* Text send thinking indicator */}
        {sendMessageMutation.isPending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>{tutorName} is thinking…</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Input Area ─────────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-border/50 bg-card">
        {/* Active mode badge + input mode toggle */}
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            {currentMode.emoji} {currentMode.label}
          </span>

          {/* ⌨️ / 🎤 toggle */}
          <div className="flex rounded-md border border-border/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
                inputMode === "text"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
              title="Type"
            >
              <Keyboard className="h-3 w-3" />
              <span>Type</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode("voice")}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer ${
                inputMode === "voice"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
              title="Speak"
            >
              <Mic className="h-3 w-3" />
              <span>Speak</span>
            </button>
          </div>
        </div>

        {/* TEXT input mode */}
        {inputMode === "text" && (
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={currentMode.placeholder}
              className="h-10 text-xs flex-1"
              disabled={isBusy || !activeConvId}
            />
            <Button
              type="submit"
              disabled={!inputText.trim() || isBusy || !activeConvId}
              className="h-10 px-4 gap-1.5 text-xs shrink-0 cursor-pointer"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* VOICE input mode — inline recording controls */}
        {inputMode === "voice" && (
          <RecordingControls
            voiceState={voice.voiceState}
            recordingSeconds={voice.recordingSeconds}
            onStartRecording={voice.startRecording}
            onStopRecording={voice.stopRecording}
            onCancelRecording={voice.cancelRecording}
            onRetryRecording={voice.retryRecording}
            onStopAudio={voice.stopAudio}
            disabled={!activeConvId}
            errorMsg={voice.errorMsg}
            voiceSettings={voice.voiceSettings}
            onVoiceSettingsChange={voice.setVoiceSettings}
          />
        )}
      </div>

      {/* Tutor Rename Modal */}
      <TutorSetupModal
        open={isSetupOpen}
        onOpenChange={setIsSetupOpen}
        currentTutorName={tutorName}
      />
    </div>
  );
}
