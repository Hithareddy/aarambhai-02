import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QueryState, CardSkeleton } from "@/components/data-state";
import { useAssessment, useSubmitAssessment } from "@/lib/api/hooks";
import type { Assessment, AssessmentAnswer, AssessmentResult } from "@/lib/api/types";
import { ArrowLeft, ArrowRight, CheckCircle2, Send, Sparkles } from "lucide-react";

const ASSESSMENT_ID = "initial-adaptive";

export const Route = createFileRoute("/assessment-quiz")({
  head: () => ({ meta: [{ title: "Your check-in — Aarambh AI" }] }),
  component: AssessmentQuizPage,
});

function AssessmentQuizPage() {
  const query = useAssessment(ASSESSMENT_ID);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <BrandLogo />
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10">
        <QueryState
          data={query.data}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => query.refetch()}
          skeleton={
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          }
        >
          {(assessment) => <QuizRunner assessment={assessment} />}
        </QueryState>
      </main>
    </div>
  );
}

function QuizRunner({ assessment }: { assessment: Assessment }) {
  const navigate = useNavigate();
  const submit = useSubmitAssessment(assessment.id);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const questions = assessment.questions;
  const question = questions[index];
  const selected = answers[question.id] ?? "";
  const isLast = index === questions.length - 1;
  const pct = Math.round(((index + 1) / questions.length) * 100);

  function handleSubmit() {
    const payload: AssessmentAnswer[] = questions.map((q) => ({
      questionId: q.id,
      optionId: answers[q.id],
    }));
    submit.mutate(payload, { onSuccess: setResult });
  }

  if (result) {
    return <AssessmentResults result={result} onDone={() => navigate({ to: "/assessments" })} />;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          <span>{assessment.title}</span>
          <span className="text-muted-foreground">
            Question {index + 1} of {questions.length}
          </span>
        </div>
        <Progress value={pct} className="mt-3 h-1.5" />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        {question.skill}
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {question.prompt}
      </h1>

      <Card className="mt-6 p-6">
        <RadioGroup
          value={selected}
          onValueChange={(v) => setAnswers((a) => ({ ...a, [question.id]: v }))}
          className="grid gap-2"
        >
          {question.options.map((opt) => (
            <label
              key={opt.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                selected === opt.id
                  ? "border-primary bg-primary-soft"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <RadioGroupItem value={opt.id} />
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </Card>

      {submit.isError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          We couldn't submit your answers. Please try again.
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          className="gap-1"
          disabled={index === 0 || submit.isPending}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {isLast ? (
          <Button className="gap-1" disabled={!selected || submit.isPending} onClick={handleSubmit}>
            {submit.isPending ? "Submitting…" : "Submit"} <Send className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="gap-1"
            disabled={!selected}
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
          >
            Next question <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function AssessmentResults({ result, onDone }: { result: AssessmentResult; onDone: () => void }) {
  return (
    <div className="text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success/15 text-success">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">
        Assessment complete
      </h1>
      <p className="mt-2 text-muted-foreground">
        You answered {result.correctCount} of {result.totalQuestions} correctly.
      </p>

      <Card className="mt-8 p-6 text-left">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Your score</span>
          <span className="font-display text-2xl font-semibold">{result.scorePercent}%</span>
        </div>
        <Progress value={result.scorePercent} className="mt-3 h-2" />

        <div className="mt-6 space-y-4">
          <p className="text-sm font-semibold">By skill</p>
          {result.skillBreakdown.map((s) => (
            <div key={s.skill}>
              <div className="flex items-center justify-between text-sm">
                <span>{s.skill}</span>
                <span className="text-muted-foreground">
                  {s.correct}/{s.total}
                </span>
              </div>
              <Progress value={s.percent} className="mt-1.5 h-1.5" />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl bg-primary-soft p-4 text-left text-primary">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{result.recommendation}</p>
        </div>
      </Card>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={onDone}>
          Go to my assessments
        </Button>
      </div>
    </div>
  );
}
