import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Getting to know you — Aarambh AI" }] }),
  component: OnboardingPage,
});

type StepKey =
  | "name"
  | "age"
  | "background"
  | "context"
  | "goal"
  | "familiarity"
  | "digital";

interface Step {
  key: StepKey;
  title: string;
  subtitle: string;
  field: "input" | "options";
  placeholder?: string;
  options?: string[];
}

const steps: Step[] = [
  {
    key: "name",
    title: "What should we call you?",
    subtitle: "This is how we'll greet you in your lessons.",
    field: "input",
    placeholder: "Your name",
  },
  {
    key: "age",
    title: "Which age group do you belong to?",
    subtitle: "This helps us shape a comfortable pace.",
    field: "options",
    options: ["Under 12", "12 – 17", "18 – 25", "26 – 45", "46 – 60", "60+"],
  },
  {
    key: "background",
    title: "What is your educational background?",
    subtitle: "Anything you share is welcome — no wrong answers.",
    field: "options",
    options: ["Never went to school", "Primary school", "Secondary school", "College", "Beyond college"],
  },
  {
    key: "context",
    title: "What best describes you right now?",
    subtitle: "We'll use this to keep your lessons relevant.",
    field: "options",
    options: ["Student", "Working professional", "Homemaker", "Senior citizen", "Just curious"],
  },
  {
    key: "goal",
    title: "What would you like to learn?",
    subtitle: "You can always change or add more goals later.",
    field: "options",
    options: ["Basic reading & writing", "Everyday English", "Digital skills", "General knowledge", "Career skills"],
  },
  {
    key: "familiarity",
    title: "How familiar are you with this topic?",
    subtitle: "Be honest — we'll meet you exactly where you are.",
    field: "options",
    options: ["Complete beginner", "I know a little", "I'm comfortable", "I'm advanced"],
  },
  {
    key: "digital",
    title: "How comfortable are you using apps?",
    subtitle: "We'll adjust the interface to feel just right.",
    field: "options",
    options: ["This is my first time", "I've used a few apps", "I use apps every day", "Very comfortable"],
  },
];

function OnboardingPage() {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<StepKey, string>>>({});
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const step = steps[i];
  const value = answers[step.key] ?? "";
  const canContinue = value.trim().length > 0;
  const pct = Math.round(((i + 1) / steps.length) * 100);

  function next() {
    if (i < steps.length - 1) setI(i + 1);
    else setDone(true);
  }

  if (done) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex items-center justify-between px-6 py-5">
          <BrandLogo />
        </header>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-10 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-success/15 text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">
            You're all set, {answers.name || "friend"}!
          </h1>
          <p className="mt-2 text-muted-foreground">
            We'll take everything you shared and shape a learning path that fits you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate({ to: "/assessment-quiz" })}>
              Continue
            </Button>
            <Button size="lg" variant="outline" onClick={() => { setDone(false); setI(0); }}>
              Review my answers
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <BrandLogo />
        <span className="text-sm text-muted-foreground">
          Step {i + 1} of {steps.length}
        </span>
      </header>
      <div className="px-6">
        <Progress value={pct} className="h-1.5" />
      </div>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Getting to know you</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-balance">
          {step.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{step.subtitle}</p>

        <Card className="mt-8 p-6">
          {step.field === "input" ? (
            <div className="grid gap-2">
              <Label htmlFor="answer">Your answer</Label>
              <Input
                id="answer"
                autoFocus
                value={value}
                placeholder={step.placeholder}
                onChange={(e) => setAnswers((a) => ({ ...a, [step.key]: e.target.value }))}
              />
            </div>
          ) : (
            <RadioGroup
              value={value}
              onValueChange={(v) => setAnswers((a) => ({ ...a, [step.key]: v }))}
              className="grid gap-2"
            >
              {step.options!.map((opt) => (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                    value === opt ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value={opt} />
                  <span className="text-sm font-medium">{opt}</span>
                </label>
              ))}
            </RadioGroup>
          )}
        </Card>

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => (i === 0 ? navigate({ to: "/signup" }) : setI(i - 1))}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={next} disabled={!canContinue} className="gap-1">
            {i === steps.length - 1 ? "Finish" : "Continue"} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
      <footer className="p-6 text-center">
        <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
          Skip for now
        </Link>
      </footer>
    </div>
  );
}
