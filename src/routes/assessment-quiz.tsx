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

interface FeedbackData {
  is_correct: boolean;
  correct_answer?: any;
  nextQuestion: Question | null;
}

function AssessmentQuizPage() {
  const navigate = useNavigate();
  const { s: searchSessionId } = Route.useSearch();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const sessionId = session?.id ?? null;
  const [question, setQuestion] = useState<Question | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [selected, setSelected] = useState<string | string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
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
      console.time("Assessment_API_Latency");
      const elapsed = Math.max(0, Math.round((Date.now() - questionStartedAt.current) / 1000));
      const evalResult = await submitAnswer(sessionId, question.id, selected, elapsed);
      const next = await getNextQuestion(sessionId);
      console.timeEnd("Assessment_API_Latency");

      setFeedbackData({
        is_correct: evalResult.is_correct,
        correct_answer: evalResult.correct_answer,
        nextQuestion: next
      });
      setSubmitting(false);

    } catch (err) {
      setError((err as Error).message || "Failed to submit your answer.");
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (!feedbackData?.nextQuestion) {
      if (sessionId) goToAnalyzing(sessionId);
      return;
    }
    setQuestion(feedbackData.nextQuestion);
    setSelected(null);
    setFeedbackData(null);
    setAnsweredCount((count) => count + 1);
    questionStartedAt.current = Date.now();
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

          {feedbackData ? (
            <div className="border border-border/50 rounded-lg p-6 space-y-4 bg-muted/10 shadow-inner">
              <h3 className={`text-xl font-bold flex items-center gap-2 ${feedbackData.is_correct ? 'text-green-600' : 'text-red-500'}`}>
                {feedbackData.is_correct ? "✅ Correct!" : "❌ Needs Practice"}
              </h3>

              {/* Listening Question Transcript Reveal */}
              {(question.audio_url || question.audio_script) && (
                <div className="bg-primary/5 p-4 rounded-md border border-primary/20">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary/60 mb-2 block">
                    Audio Transcript / Target
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {question.audio_script || (Array.isArray(feedbackData.correct_answer) ? feedbackData.correct_answer.join(" ") : feedbackData.correct_answer) || "No transcript available."}
                  </p>
                </div>
              )}

              {/* Arrange Question Diff Highlights */}
              {question.question_type === 'arrange' && Array.isArray(selected) && Array.isArray(feedbackData.correct_answer) && (
                <div className="space-y-5 pt-3 border-t">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                      Your Sequence
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selected.map((word, i) => {
                        const isCorrectPosition = feedbackData.correct_answer[i] === word;
                        const isCorrectButWrongPosition = !isCorrectPosition && feedbackData.correct_answer.includes(word);

                        let classes = 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200'; // Wrong position
                        if (isCorrectPosition) classes = 'bg-green-100 text-green-900 border-green-300 dark:bg-green-900/30 dark:border-green-700 dark:text-green-200';
                        if (!isCorrectPosition && !isCorrectButWrongPosition) classes = 'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200'; // Missing/Incorrect word entirely

                        return (
                          <span key={`l-${i}`} className={`px-2.5 py-1.5 rounded-md text-sm font-semibold border ${classes}`}>
                            {word}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-400 mr-1" /> Correct
                      <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400 mr-1 ml-3" /> Wrong Position
                      <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-400 mr-1 ml-3" /> Incorrect Word
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-green-600 dark:text-green-500 block mb-2">
                      Correct Sequence
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {feedbackData.correct_answer.map((w: string, i: number) => (
                        <span key={`c-${i}`} className="px-2.5 py-1.5 rounded-md text-sm font-semibold bg-green-100/50 text-green-900 border border-green-200/50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <QuestionRenderer
              question={question}
              selected={selected}
              onSelect={setSelected}
              submitting={submitting}
            />
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            {feedbackData ? (
              <Button size="lg" onClick={handleContinue}>
                {feedbackData.nextQuestion ? (t("assessmentQuiz.nextQuestion") || "Next question") : (t("assessmentQuiz.submitFinish") || "Submit & finish")}
              </Button>
            ) : (
              <Button size="lg" onClick={handleSubmit} disabled={selected === null || submitting}>
                {submitting ? (t("assessmentQuiz.saving") || "Saving...") : (t("assessmentQuiz.submitAnswer") || "Check Answer")}
              </Button>
            )}
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
