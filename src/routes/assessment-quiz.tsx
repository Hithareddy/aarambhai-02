import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  startAssessmentSession,
  getNextQuestion,
  submitAnswer,
  type Question,
  type AssessmentSession,
} from "@/lib/api/assessment";
import { AssessmentProgress } from "@/components/AssessmentProgress";
import { QuestionRenderer } from "@/components/questions/QuestionRenderer";
import { HelpWidget } from "@/components/questions/HelpWidget";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogOut, BookOpen, AlertTriangle, AlertCircle } from "lucide-react";
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
import { useLanguage } from "@/hooks/use-language";

const searchSchema = z.object({ s: z.string().optional() });

export const Route = createFileRoute("/assessment-quiz")({
  head: () => ({ meta: [{ title: "Assessment Quiz — Aarambh AI" }] }),
  validateSearch: searchSchema,
  component: AssessmentQuizPage,
});

function AssessmentQuizPage() {
  const navigate = useNavigate();
  const { s: searchSessionId } = Route.useSearch();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const sessionId = session?.id ?? null;
  const [question, setQuestion] = useState<Question | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const questionStartedAt = useRef<number>(Date.now());
  const { t } = useLanguage();

  const goToAnalyzing = useCallback(
    (id: string) => {
      navigate({ to: "/assessment-analyzing", search: { s: id } });
    },
    [navigate],
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        let currentSession: AssessmentSession | null = null;
        let id = searchSessionId || localStorage.getItem("assessment_session_id");

        if (!id) {
          currentSession = await startAssessmentSession();
          id = currentSession.id;
          localStorage.setItem("assessment_session_id", id);
        } else {
          // We don't have a getSession API yet, rely on fallback of 15 questions
          currentSession = { id, status: "in_progress", currentIndex: 0, totalQuestions: 15 };
        }

        if (!active) return;
        setSession(currentSession);

        const firstQuestion = await getNextQuestion(id);

        if (!firstQuestion) {
          goToAnalyzing(id);
          return;
        }
        setQuestion(firstQuestion);
        questionStartedAt.current = Date.now();
      } catch (err) {
        if (!active) return;
        setError((err as Error).message || "Failed to load the assessment.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [searchSessionId, goToAnalyzing]);

  const handleSubmit = async () => {
    if (!sessionId || !question || selected === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const elapsed = Math.max(0, Math.round((Date.now() - questionStartedAt.current) / 1000));
      await submitAnswer(sessionId, question.id, selected, elapsed);
      const next = await getNextQuestion(sessionId);
      if (!next) {
        goToAnalyzing(sessionId);
        return;
      }
      setQuestion(next);
      setSelected(null);
      setAnsweredCount((count) => count + 1);
      questionStartedAt.current = Date.now();
      setSubmitting(false);
    } catch (err) {
      setError((err as Error).message || "Failed to submit your answer.");
      setSubmitting(false);
    }
  };

  const doExit = () => {
    localStorage.removeItem("assessment_session_id");
    navigate({ to: "/dashboard" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t("assessmentQuiz.loading") || "Loading assessment..."}</p>
        </div>
      </div>
    );
  }

  if (error && !question) {
    return (
      <main className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-destructive" size={40} />
          <h2 className="text-xl font-semibold mb-2">{t("assessmentQuiz.unableStart") || "Unable to start assessment"}</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate({ to: "/assessment-intro" })}>{t("assessmentQuiz.backSetup") || "Back to setup"}</Button>
        </Card>
      </main>
    );
  }

  if (!question) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-5 border-b">
        <div className="flex items-center gap-2 text-primary font-bold">
          <BookOpen size={20} />
          <span>{t("assessmentQuiz.workspaceTitle") || "Aarambh AI Evaluation Workspace"}</span>
        </div>
        <Button
          variant="ghost"
          onClick={() => setConfirmExit(true)}
          className="gap-2 text-muted-foreground"
        >
          <LogOut size={16} />
          {t("assessmentQuiz.abandonBtn") || "Abandon Test"}
        </Button>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <AssessmentProgress
          currentIndex={answeredCount}
          total={session?.totalQuestions ?? 15}
          currentSkill={question.skill}
        />

        {question.isFallback && (
          <Alert className="bg-warning/10 border-warning/30 text-warning-foreground">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t("assessmentQuiz.fallbackMessage") || "Questions are temporarily shown in English while content for the selected language is being prepared."}
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-8 space-y-6" aria-live="polite">
          <div className="flex justify-end">
            <HelpWidget question={question} />
          </div>
          <QuestionRenderer
            question={question}
            selected={selected}
            onSelect={setSelected}
            submitting={submitting}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button size="lg" onClick={handleSubmit} disabled={selected === null || submitting}>
              {submitting
                ? (t("assessmentQuiz.saving") || "Saving...")
                : answeredCount + 1 >= (session?.totalQuestions ?? 15)
                  ? (t("assessmentQuiz.submitFinish") || "Submit & finish")
                  : (t("assessmentQuiz.nextQuestion") || "Next question")}
            </Button>
          </div>
        </Card>
      </main>

      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-primary" />
              <AlertDialogTitle>{t("assessmentQuiz.dialogTitle") || "Abandon placement assessment?"}</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {t("assessmentQuiz.dialogDesc") || "Your current answers in this session will not yield placement records. You can run the calibration setup screens again later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("assessmentQuiz.dialogCancel") || "Go Back to Quiz"}</AlertDialogCancel>
            <AlertDialogAction onClick={doExit}>{t("assessmentQuiz.dialogDiscard") || "Discard Session"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
