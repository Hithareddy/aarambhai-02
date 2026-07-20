import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  startAssessmentSession,
  getNextQuestion,
  submitAnswer,
  TOTAL_QUESTIONS,
  type Question,
} from "@/lib/api/assessment";
import { AssessmentProgress } from "@/components/AssessmentProgress";
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

const searchSchema = z.object({ s: z.string().optional() });

export const Route = createFileRoute("/assessment-quiz")({
  head: () => ({ meta: [{ title: "Assessment Quiz — Aarambh AI" }] }),
  validateSearch: searchSchema,
  component: AssessmentQuizPage,
});

function AssessmentQuizPage() {
  const navigate = useNavigate();
  const { s: searchSessionId } = Route.useSearch();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const questionStartedAt = useRef<number>(Date.now());

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
        let id = searchSessionId || localStorage.getItem("assessment_session_id");
        if (!id) {
          const session = await startAssessmentSession();
          id = session.id;
          localStorage.setItem("assessment_session_id", id);
        }
        const firstQuestion = await getNextQuestion(id);
        if (!active) return;
        setSessionId(id);
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
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error && !question) {
    return (
      <main className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-destructive" size={40} />
          <h2 className="text-xl font-semibold mb-2">Unable to start assessment</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate({ to: "/assessment-intro" })}>Back to setup</Button>
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
          <span>Aarambh AI Evaluation Workspace</span>
        </div>
        <Button
          variant="ghost"
          onClick={() => setConfirmExit(true)}
          className="gap-2 text-muted-foreground"
        >
          <LogOut size={16} />
          Abandon Test
        </Button>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <AssessmentProgress
          currentIndex={answeredCount}
          total={TOTAL_QUESTIONS}
          currentSkill={question.skill}
        />

        <Card className="p-8 space-y-6" aria-live="polite">
          <h2 className="text-xl font-semibold">{question.prompt}</h2>

          <div className="grid gap-3">
            {question.options.map((option) => {
              const isSelected = selected === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={submitting}
                  onClick={() => setSelected(option.id)}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                    isSelected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {option.id}
                  </span>
                  <span>{option.text}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button size="lg" onClick={handleSubmit} disabled={selected === null || submitting}>
              {submitting
                ? "Saving..."
                : answeredCount + 1 >= TOTAL_QUESTIONS
                  ? "Submit & finish"
                  : "Next question"}
            </Button>
          </div>
        </Card>
      </main>

      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-primary" />
              <AlertDialogTitle>Abandon placement assessment?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Your current answers in this session will not yield placement records. You can run the
              calibration setup screens again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back to Quiz</AlertDialogCancel>
            <AlertDialogAction onClick={doExit}>Discard Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
