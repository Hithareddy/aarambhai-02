import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  startAssessmentSession,
  getNextQuestion,
  submitAnswer,
  completeAssessment,
  type AnswerResponse,
  type AssessmentSession,
  type Question,
  type LearnerProfile,
  DEFAULT_PROFILE,
} from "@/lib/api/assessment";
import { AssessmentProgress } from "@/components/AssessmentProgress";
import { SkillProgressPanel } from "@/components/SkillProgressPanel";
import { ListeningQuestion } from "@/components/questions/ListeningQuestion";
import { SpeakingQuestion } from "@/components/questions/SpeakingQuestion";
import { ReadingQuestion } from "@/components/questions/ReadingQuestion";
import { WritingQuestion } from "@/components/questions/WritingQuestion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, BookOpen, AlertTriangle } from "lucide-react";
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
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      const sessionId = searchSessionId || localStorage.getItem("assessment_session_id");
      
      if (!sessionId) {
        // Start new session
        try {
          const profile: LearnerProfile = DEFAULT_PROFILE;
          const newSession = await startAssessmentSession(profile);
          setSession(newSession);
          localStorage.setItem("assessment_session_id", newSession.id);
          
          // Load first question
          const firstQuestion = await getNextQuestion(newSession.id);
          setQuestion(firstQuestion);
        } catch (err) {
          console.error("Failed to start session:", err);
          navigate({ to: "/assessment-intro" });
        }
      } else {
        // Load existing session
        try {
          const nextQ = await getNextQuestion(sessionId);
          setQuestion(nextQ);
          setSession({
            id: sessionId,
            profile: DEFAULT_PROFILE,
            createdAt: new Date().toISOString(),
            status: "in_progress",
            plan: [],
            currentIndex: 0,
            answers: [],
            skillCounts: {
              listening: { asked: 0, total: 2 },
              speaking: { asked: 0, total: 2 },
              reading: { asked: 0, total: 2 },
              writing: { asked: 0, total: 2 },
            },
            warnings: [],
          });
        } catch (err) {
          console.error("Failed to load session:", err);
          navigate({ to: "/assessment-intro" });
        }
      }
      setLoading(false);
    };

    loadSession();
  }, [searchSessionId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!session || !question) {
    return null;
  }

  const handleSubmit = async (response: AnswerResponse) => {
    setSubmitting(true);
    setStatus("Recording answer & selecting next question...");

    try {
      const result = await submitAnswer(session.id, question.id, response);
      
      if (result.done) {
        // Assessment complete, go to analyzing
        navigate({ to: "/assessment-analyzing", search: { s: session.id } });
        return;
      }

      if (result.nextQuestion) {
        setQuestion(result.nextQuestion);
        // Update session progress
        setSession((prev) => prev ? { ...prev, currentIndex: (prev?.currentIndex || 0) + 1 } : null);
      }
      setSubmitting(false);
      setStatus(null);
    } catch (err: unknown) {
      setSubmitting(false);
      setStatus(`Error submitting: ${(err as Error)?.message ?? "unknown error"}`);
    }
  };

  const doExit = () => {
    localStorage.removeItem("assessment_session_id");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner */}
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

      {/* Main content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Left Side: Skill Progress */}
          <aside className="space-y-4">
            <SkillProgressPanel
              counts={session.skillCounts}
              currentSkill={question.skill}
            />
          </aside>

          {/* Right Side: Question */}
          <section className="space-y-4">
            <AssessmentProgress
              currentIndex={session.currentIndex}
              total={8}
              currentSkill={question.skill}
            />

            <Card className="p-8" aria-live="polite">
              {renderQuestion(question, submitting, handleSubmit)}

              {status && (
                <div className="mt-6 flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <span className="font-medium text-primary">{status}</span>
                </div>
              )}
            </Card>
          </section>
        </div>
      </main>

      {/* Exit dialog */}
      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-primary" />
              <AlertDialogTitle>Abandon placement assessment?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Your current questions answered inside this session will not yield placement records.
              You can run calibration setup screens again later.
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

function renderQuestion(q: Question, disabled: boolean, onSubmit: (r: AnswerResponse) => void) {
  switch (q.type) {
    case "listening_mcq":
      return (
        <ListeningQuestion
          question={q}
          disabled={disabled}
          onSubmit={(i, interaction) => onSubmit({ kind: "mcq", selectedIndex: i, ...interaction })}
        />
      );
    case "speaking_prompt":
      return (
        <SpeakingQuestion
          question={q}
          disabled={disabled}
          onSubmit={(p) =>
            onSubmit({ kind: "speech", transcript: p.transcript, durationMs: p.durationMs })
          }
        />
      );
    case "reading_mcq":
      return (
        <ReadingQuestion
          question={q}
          disabled={disabled}
          onSubmit={(i) => onSubmit({ kind: "mcq", selectedIndex: i })}
        />
      );
    case "writing_prompt":
      return (
        <WritingQuestion
          question={q}
          disabled={disabled}
          onSubmit={(p) => onSubmit({ kind: "writing", text: p.text, wordCount: p.wordCount })}
        />
      );
    default:
      return <div className="text-center text-muted-foreground">Unknown question type</div>;
  }
}
