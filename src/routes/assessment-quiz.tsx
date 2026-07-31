import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";


import { AssessmentProgress } from "@/components/AssessmentProgress";
import { QuestionRenderer } from "@/components/questions/QuestionRenderer";
import { QuestionErrorBoundary } from "@/components/questions/QuestionErrorBoundary";
import { HelpWidget } from "@/components/questions/HelpWidget";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Sparkles, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const searchSchema = z.object({ s: z.string().optional() });

export const Route = createFileRoute("/assessment-quiz")({
  head: () => ({ meta: [{ title: "Interactive Literacy Diagnostic — Aarambh AI" }] }),
  validateSearch: searchSchema,
  component: AssessmentQuizPage,
});

interface FeedbackState {
  isCorrect: boolean;
}

import {
  startAssessmentSession,
  getAssessmentSession,
  getNextQuestion,
  submitAnswer,
  completeAssessment,
  type Question,
  type AssessmentSession
} from "@/lib/api/assessment";
import { toast } from "sonner";
import { useAdminGuard } from "@/hooks/use-admin-guard";

export function AssessmentQuizPage() {
  const { checking } = useAdminGuard();
  const navigate = useNavigate();

  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(15);

  const [selected, setSelected] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize session and pull first question
  useEffect(() => {
    if (checking) return;

    const initSession = async () => {
      setLoading(true);
      setError(null);
      const cachedSessionId = localStorage.getItem("assessment_session_id");
      let activeSession: AssessmentSession | null = null;

      if (cachedSessionId) {
        try {
          const sess = await getAssessmentSession(cachedSessionId);
          if (sess && sess.status === "in_progress") {
            activeSession = sess;
          } else {
            localStorage.removeItem("assessment_session_id");
          }
        } catch (err) {
          console.warn("Cached session invalid or not found, starting fresh:", err);
          localStorage.removeItem("assessment_session_id");
        }
      }

      if (!activeSession) {
        try {
          activeSession = await startAssessmentSession();
          localStorage.setItem("assessment_session_id", activeSession.id);
        } catch (err: any) {
          console.error("Failed to start assessment session:", err);
          setError("Failed to initialize assessment session. Please verify that your learner profile is complete and the database is active.");
          setLoading(false);
          return;
        }
      }

      setSession(activeSession);
      setCurrentIndex(activeSession.currentIndex);
      setTotalQuestions(activeSession.totalQuestions);

      // Fetch first question
      try {
        const firstQ = await getNextQuestion(activeSession.id);
        if (firstQ) {
          setActiveQuestion(firstQ);
          setStartTime(Date.now());
        } else {
          setError("Database Configuration Error: No active diagnostic questions found in the database. Please ensure the database question bank is seeded.");
        }
      } catch (err: any) {
        console.error("Failed to load first question:", err);
        const errMsg = err.message || "";
        if (errMsg.toLowerCase().includes("no questions") || errMsg.toLowerCase().includes("no more questions")) {
          setError("Database Configuration Error: No active diagnostic questions found in the database. Please ensure the database question bank is seeded.");
        } else {
          setError(`Error loading assessment question: ${err.message || err}`);
        }
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  const handleContinueNext = useCallback(async () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }

    if (!session) return;

    setLoading(true);
    setFeedback(null);
    setSelected(null);
    setSubmitting(false);

    try {
      const nextQ = await getNextQuestion(session.id);
      if (nextQ) {
        setActiveQuestion(nextQ);
        setCurrentIndex((idx) => idx + 1);
        setStartTime(Date.now());
        setLoading(false);
      } else {
        // Complete the assessment and get results
        await completeAssessment(session.id);
        navigate({ to: "/assessment-results", search: { s: session.id } });
      }
    } catch (err: any) {
      console.error("Failed to load next question or complete assessment:", err);
      const errMsg = err.message || "";
      if (errMsg.toLowerCase().includes("no more questions") || errMsg.toLowerCase().includes("no questions")) {
        try {
          await completeAssessment(session.id);
          navigate({ to: "/assessment-results", search: { s: session.id } });
        } catch (compErr: any) {
          console.error("Failed to complete assessment:", compErr);
          setError(`Failed to finalize assessment: ${compErr.message || compErr}`);
          setLoading(false);
        }
      } else {
        setError(`Error transitioning: ${err.message || err}`);
        setLoading(false);
      }
    }
  }, [session, navigate]);

  const handleSubmitAnswer = async () => {
    if (!session || !activeQuestion || selected === null || submitting) return;
    setSubmitting(true);

    const responseTime = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await submitAnswer(session.id, activeQuestion.id, selected, responseTime);
      setFeedback({ isCorrect: res.is_correct });
      
      autoAdvanceTimer.current = setTimeout(() => {
        handleContinueNext();
      }, 900);
    } catch (err: any) {
      console.error("Failed to submit answer:", err);
      toast.error(`Failed to submit answer: ${err.message || err}`);
      setSubmitting(false);
    }
  };

  const doExit = () => {
    localStorage.removeItem("assessment_session_id");
    navigate({ to: "/dashboard" });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <Card className="max-w-md w-full p-6 text-center space-y-6 rounded-3xl border-destructive/20 shadow-md">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-destructive/15 text-destructive text-2xl font-bold">
            ⚠️
          </div>
          <div className="space-y-2">
            <h2 className="font-extrabold text-xl text-foreground">Diagnostic Load Error</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => navigate({ to: "/dashboard" })}>
              Return to Dashboard
            </Button>
            <Button className="rounded-xl font-bold" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading || !activeQuestion || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground animate-pulse text-sm font-medium">Validating interactive question deck...</p>
        </div>
      </div>
    );
  }

  const difficultyLabels: Record<number, string> = { 1: 'Easy', 2: 'Basic', 3: 'Medium', 4: 'Advanced', 5: 'Expert' };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-background to-background dark:from-blue-950/20">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
            ✨
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-none text-foreground">Aarambh AI Diagnostic</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Interactive Diagnostic Check-In</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1 font-bold text-xs border-primary/30 text-primary bg-primary/5">
            Level: {difficultyLabels[activeQuestion.difficulty] || activeQuestion.difficulty}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmExit(true)}
            className="gap-1.5 text-xs text-muted-foreground hover:text-destructive font-semibold"
          >
            <LogOut className="h-4 w-4" />
            <span>Exit</span>
          </Button>
        </div>
      </header>

      {/* Main Stage */}
      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold text-muted-foreground">
            <span className="flex items-center gap-1 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="uppercase tracking-wider">{activeQuestion.skill}</span>
          </div>

          <AssessmentProgress
            currentIndex={currentIndex}
            total={totalQuestions}
            currentSkill={activeQuestion.skill}
          />
        </div>

        {/* Question Container Card wrapped in Error Boundary */}
        <Card className="p-6 sm:p-8 rounded-3xl border-2 border-primary/20 shadow-md bg-card relative overflow-hidden space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold capitalize">
              {activeQuestion.question_type.replace('_', ' ')}
            </Badge>
            <HelpWidget question={activeQuestion} />
          </div>

          {/* Question Renderer wrapped safely in QuestionErrorBoundary */}
          <QuestionErrorBoundary
            key={activeQuestion.id}
            questionId={activeQuestion.id}
            onSkipNext={handleContinueNext}
          >
            <QuestionRenderer
              question={activeQuestion}
              selected={selected}
              onSelect={setSelected}
              submitting={submitting || feedback !== null}
            />
          </QuestionErrorBoundary>

          {/* Seamless Inline Feedback Toast */}
          {feedback && (
            <div className="mt-6 flex items-center justify-between p-4 rounded-2xl border bg-card/95 backdrop-blur shadow-lg animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-xl font-bold text-lg ${
                  feedback.isCorrect
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                }`}>
                  {feedback.isCorrect ? "✨" : "💡"}
                </div>
                <div>
                  <h4 className={`font-extrabold text-sm ${feedback.isCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                    {feedback.isCorrect ? "Great Job! Correct." : "Recorded — Moving forward..."}
                  </h4>
                  <p className="text-xs text-muted-foreground">Continuing to next item...</p>
                </div>
              </div>

              <Button size="sm" variant="ghost" onClick={handleContinueNext} className="font-bold text-xs">
                Skip →
              </Button>
            </div>
          )}

          {/* Action Submit Button */}
          {!feedback && (
            <div className="flex justify-end pt-2 border-t">
              <Button
                size="lg"
                onClick={handleSubmitAnswer}
                disabled={selected === null || submitting}
                className="min-w-[180px] h-14 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition-all"
              >
                {submitting ? "Checking..." : "Check Answer →"}
              </Button>
            </div>
          )}
        </Card>
      </main>

      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-6 w-6 text-primary" />
              <AlertDialogTitle>Pause Diagnostic Assessment?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Your progress will be saved. You can resume your friendly diagnostic check-in anytime from your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Return to Assessment</AlertDialogCancel>
            <AlertDialogAction onClick={doExit} className="rounded-xl">Exit to Dashboard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
