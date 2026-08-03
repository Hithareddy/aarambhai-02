import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  Bot,
  Send,
  Loader2,
  X,
  Mic,
  MessageSquare,
  Sparkles,
  HelpCircle,
  BookOpen,
  Volume2,
  Languages,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Zap,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useTutorProfile,
  useTutorConversations,
  useCreateConversation,
  useTutorMessages,
  useSendTutorMessage,
} from "@/lib/api/hooks";
import { useLearningContext } from "@/context/learning-context";
import {
  RecordingControls,
  useVoiceTutor,
} from "./tutor-voice-mode";
import type { TutorConversation, ScreenContextPayload } from "@/lib/api/types";

export function FloatingAITutor() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hide floating Tutor on full-page AI Tutor route or onboarding/auth routes
  if (
    pathname === "/ai-tutor" ||
    pathname.startsWith("/ai-tutor/") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/onboarding"
  ) {
    return null;
  }

  return <FloatingAITutorPanel />;
}

function FloatingAITutorPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");

  const scrollRef = useRef<HTMLDivElement>(null);
  const learningCtx = useLearningContext();

  const { data: profile } = useTutorProfile();
  const { data: conversations } = useTutorConversations();
  const createConvMutation = useCreateConversation();

  // Create or retrieve session conversation on mount
  useEffect(() => {
    if (!activeConvId && !createConvMutation.isPending) {
      if (conversations && conversations.length > 0) {
        setActiveConvId(conversations[0].id);
      } else {
        createConvMutation.mutate(undefined, {
          onSuccess: (newConv: TutorConversation) => {
            setActiveConvId(newConv.id);
          },
        });
      }
    }
  }, [conversations, activeConvId]);

  const { data: messages, isLoading: isMessagesLoading } = useTutorMessages(
    activeConvId || undefined
  );
  const sendMessageMutation = useSendTutorMessage();

  // Extract live screen context payload dynamically
  const getScreenContextPayload = useCallback((): ScreenContextPayload => {
    const s = learningCtx.state;
    return {
      page_type: s.pageType,
      assessment_mode: s.assessmentMode,
      module_id: s.moduleId,
      module_title: s.moduleTitle,
      lesson_id: s.lessonId,
      lesson_title: s.lessonTitle,
      skill: s.skill,
      activity_id: s.activityId,
      activity_type: s.activityType,
      activity_title: s.activityTitle,
      displayed_content: s.displayedContent,
      question_id: s.questionId,
      question_type: s.questionType,
      difficulty: s.difficulty,
      learner_answer: s.learnerAnswer,
      correct_answer: s.correctAnswer,
      answer_status: s.answerStatus,
    };
  }, [learningCtx.state]);

  // Voice tutor hook connection
  const voice = useVoiceTutor(
    activeConvId || "",
    "free_talk",
    () => setInputMode("text"),
    getScreenContextPayload
  );

  // Auto-scroll messages container
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessageMutation.isPending, voice.voiceState, isOpen]);

  const tutorName = profile?.tutor_name || "Mira";
  const state = learningCtx.state;
  const isAssessment = state.assessmentMode === true;

  // Send message or quick action
  const handleSend = (overrideText?: string) => {
    const textToSend = (overrideText || inputText).trim();
    if (!textToSend || !activeConvId || sendMessageMutation.isPending) return;

    if (!overrideText) setInputText("");
    setErrorMessage(null);

    const screenContext = getScreenContextPayload();

    sendMessageMutation.mutate(
      {
        conversationId: activeConvId,
        message: textToSend,
        mode: "free_talk",
        screenContext,
      },
      {
        onError: (err: any) => {
          setErrorMessage(
            err.message || "Unable to reach AI Tutor right now. Please try again."
          );
        },
      }
    );
  };

  const handleNewSession = () => {
    setErrorMessage(null);
    createConvMutation.mutate(undefined, {
      onSuccess: (newConv: TutorConversation) => {
        setActiveConvId(newConv.id);
      },
    });
  };

  // Generate context-aware quick actions without any external API calls
  const renderQuickActions = () => {
    if (isAssessment) {
      return (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleSend("How does this assessment work?")}
            className="h-7 text-xs rounded-full gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/20"
          >
            <HelpCircle className="h-3 w-3" />
            <span>How assessment works?</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleSend("Give me some quick motivation and encouragement!")}
            className="h-7 text-xs rounded-full gap-1 bg-primary/10 text-primary hover:bg-primary/20"
          >
            <Sparkles className="h-3 w-3" />
            <span>Encouragement</span>
          </Button>
        </div>
      );
    }

    const actions = [];

    // Prominent wrong answer explanation pill
    if (state.answerStatus === "incorrect") {
      actions.push({
        label: "Why was my answer wrong?",
        prompt: "Why was my answer wrong? Help me understand without just giving me a rule to memorize.",
        icon: <AlertCircle className="h-3 w-3 text-red-500" />,
        highlight: true,
      });
    }

    // Skill & Activity specific actions
    actions.push({
      label: "Explain simply",
      prompt: "Explain this current concept simply in 2-3 short sentences.",
      icon: <BookOpen className="h-3 w-3 text-blue-500" />,
    });

    actions.push({
      label: "Give an example",
      prompt: "Give me a practical everyday example related to this lesson.",
      icon: <Lightbulb className="h-3 w-3 text-amber-500" />,
    });

    if (state.skill === "reading" || state.displayedContent) {
      actions.push({
        label: "Translate",
        prompt: "Translate this displayed text into my support language.",
        icon: <Languages className="h-3 w-3 text-emerald-500" />,
      });
    }

    actions.push({
      label: "Pronunciation help",
      prompt: "Help me pronounce the key words on this screen.",
      icon: <Volume2 className="h-3 w-3 text-purple-500" />,
    });

    return (
      <div className="flex flex-wrap gap-1.5 mb-3">
        {actions.map((act, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(act.prompt)}
            disabled={sendMessageMutation.isPending}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer ${
              act.highlight
                ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20 font-semibold shadow-xs"
                : "bg-secondary/70 hover:bg-secondary text-secondary-foreground border-border/50"
            }`}
          >
            {act.icon}
            <span>{act.label}</span>
          </button>
        ))}
      </div>
    );
  };

  // Context Header display string
  const contextLabel = isAssessment
    ? "🔒 Placement Assessment"
    : state.lessonTitle || state.moduleTitle || state.activityTitle
    ? `Helping with: ${state.lessonTitle || state.moduleTitle || state.activityTitle}`
    : "✨ Context-Aware AI Tutor";

  return (
    <>
      {/* ── Floating Trigger Button (CLOSED STATE) ──────────────────── */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
          <Button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open Aarambh AI Tutor"
            className="h-13 px-4 rounded-full bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer flex items-center gap-2.5 border border-white/20"
          >
            <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-white/20 text-white">
              <Bot className="h-5 w-5 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-primary" />
            </div>
            <div className="flex flex-col text-left pr-1">
              <span className="text-xs font-bold leading-tight flex items-center gap-1">
                Aarambh Tutor
                <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
              </span>
              <span className="text-[10px] text-primary-foreground/80 font-medium truncate max-w-[130px]">
                {isAssessment ? "🔒 Assessment Mode" : state.lessonTitle || "Tap for help"}
              </span>
            </div>
          </Button>
        </div>
      )}

      {/* ── Contextual Tutor Side Panel / Drawer (OPEN STATE) ────── */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col h-full bg-card border-l border-border shadow-2xl">
          {/* Header */}
          <SheetHeader className="px-4 py-3.5 border-b border-border bg-gradient-to-r from-primary/10 via-card to-accent/10 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex flex-col">
                <SheetTitle className="text-sm font-bold truncate flex items-center gap-1.5">
                  🤖 {tutorName}
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-primary/30 text-primary font-normal">
                    AI Tutor
                  </Badge>
                </SheetTitle>
                <span className="text-[11px] text-muted-foreground truncate font-medium">
                  {contextLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNewSession}
                title="New Session"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Assessment Mode Notice */}
          {isAssessment && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Diagnostic Assessment active. Tutor gives general guidance only.</span>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-hidden flex flex-col p-4 bg-background/50">
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
              {/* Session Start / Context Overview Card */}
              {(!messages || messages.length <= 1) && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/60 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Need help with this screen?</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {isAssessment
                      ? "I can explain test instructions or give general learning tips."
                      : state.displayedContent
                      ? `I can explain: "${state.displayedContent.slice(0, 60)}${state.displayedContent.length > 60 ? "..." : ""}"`
                      : "Ask me anything! I understand your current lesson context."}
                  </p>
                </div>
              )}

              {/* Quick Actions Pills */}
              {renderQuickActions()}

              {/* Message History */}
              {isMessagesLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-xs gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading Tutor session...</span>
                </div>
              ) : (
                messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "learner" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        msg.role === "learner"
                          ? "bg-primary text-primary-foreground rounded-br-xs shadow-xs"
                          : "bg-card border border-border/80 text-card-foreground rounded-bl-xs shadow-xs"
                      }`}
                    >
                      {msg.role === "tutor" && (
                        <div className="font-semibold text-[10px] text-primary mb-1 flex items-center gap-1">
                          <span>{tutorName}</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}

              {/* Typing State */}
              {sendMessageMutation.isPending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border/60 rounded-2xl px-3.5 py-2 w-max animate-pulse">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>{tutorName} is thinking...</span>
                </div>
              )}

              {/* Error State */}
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-border bg-card flex flex-col gap-2">
            {inputMode === "voice" ? (
              <RecordingControls
                voiceState={voice.voiceState}
                recordingSeconds={voice.recordingSeconds}
                errorMsg={voice.errorMsg}
                onStartRecording={voice.startRecording}
                onStopRecording={voice.stopRecording}
                onCancelRecording={voice.cancelRecording}
                onRetryRecording={voice.retryRecording}
                onStopAudio={voice.stopAudio}
                disabled={sendMessageMutation.isPending}
                voiceSettings={voice.voiceSettings}
                onVoiceSettingsChange={voice.setVoiceSettings}
              />
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isAssessment
                      ? "Ask about instructions or support..."
                      : "Ask about this lesson..."
                  }
                  className="flex-1 h-10 text-xs rounded-xl bg-background border-border"
                  disabled={sendMessageMutation.isPending}
                />

                {/* Voice Toggle */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setInputMode("voice")}
                  className="h-10 w-10 shrink-0 rounded-xl text-muted-foreground hover:text-primary cursor-pointer"
                  title="Voice Mode"
                >
                  <Mic className="h-4 w-4" />
                </Button>

                {/* Send Button */}
                <Button
                  type="submit"
                  disabled={!inputText.trim() || sendMessageMutation.isPending}
                  className="h-10 w-10 shrink-0 rounded-xl cursor-pointer p-0"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
