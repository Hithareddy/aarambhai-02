import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { saveLearnerProfile } from "@/lib/api/learner";
import { useLanguage } from "@/hooks/use-language";
import { LANGUAGES } from "@/constants/languages";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Getting to know you — Aarambh AI" }] }),
  component: OnboardingPage,
});

type StepKey = "name" | "age" | "background" | "context" | "goal" | "familiarity" | "digital" | "target_language";

interface Step {
  key: StepKey;
  title: string;
  subtitle: string;
  field: "input" | "options";
  placeholder?: string;
  options?: string[] | ((lang: string) => string[]);
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
    options: [
      "Never went to school",
      "Primary school",
      "Secondary school",
      "College",
      "Beyond college",
    ],
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
    options: [
      "Basic reading & writing",
      "Everyday English",
      "Digital skills",
      "General knowledge",
      "Career skills",
    ],
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
    options: [
      "This is my first time",
      "I've used a few apps",
      "I use apps every day",
      "Very comfortable",
    ],
  },
  {
    key: "target_language",
    title: "Which language do you want to learn?",
    subtitle: "This will be the target language for lessons and assessments.",
    field: "options",
    options: LANGUAGES.map(l => l.native),
  }
];

const getStepTranslationKeys = (key: StepKey) => {
  switch (key) {
    case "name": return { title: "onboarding.qNameTitle", sub: "onboarding.qNameSub" };
    case "age": return { title: "onboarding.qAgeTitle", sub: "onboarding.qAgeSub" };
    case "background": return { title: "onboarding.qBgTitle", sub: "onboarding.qBgSub" };
    case "context": return { title: "onboarding.qRoleTitle", sub: "onboarding.qRoleSub" };
    case "goal": return { title: "onboarding.qGoalTitle", sub: "onboarding.qGoalSub" };
    case "digital": return { title: "onboarding.qDigTitle", sub: "onboarding.qDigSub" };
    case "target_language": return { title: "onboarding.qTgtLangTitle", sub: "onboarding.qTgtLangSub" };
    default: return { title: "", sub: "" };
  }
};

function OnboardingPage() {
  const { t, websiteLanguage, setTargetLanguage } = useLanguage();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<StepKey, string>>>(() => {
    const defaultTgt = localStorage.getItem("target_language") || localStorage.getItem("learning_language") || "en";
    const uiLabelMap: Record<string, string> = {
      en: "English",
      te: "తెలుగు",
      hi: "हिन्दी",
      ta: "தமிழ்",
      mr: "मराठी",
    };
    return {
      target_language: uiLabelMap[defaultTgt] || "English",
    };
  });
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const step = steps[i];
  const value = answers[step.key] ?? "";
  const canContinue = value.trim().length > 0;
  const pct = Math.round(((i + 1) / steps.length) * 100);

  const translationKeys = getStepTranslationKeys(step.key);
  const stepTitle = t(translationKeys.title) || step.title;
  const stepSubtitle = t(translationKeys.sub) || step.subtitle;

  const currentOptions = useMemo(() => {
    if (typeof step.options === 'function') {
      return step.options(answers.target_language || "English");
    }
    return step.options;
  }, [step, answers.target_language]);

  async function next() {
    if (i < steps.length - 1) {
      setI(i + 1);
      return;
    }
    setSaving(true);
    setError(null);

    // Map native language presentation to code
    const targetLangCode = LANGUAGES.find(l => l.native === answers.target_language)?.code || "en";

    // Set immediate client-side reactive target preference
    setTargetLanguage(targetLangCode as any);

    try {
      await saveLearnerProfile({
        name: answers.name ?? "",
        age_group: answers.age ?? "",
        educational_background: answers.background ?? "",
        current_role: answers.context ?? "",
        learning_goal: answers.goal ?? "",
        learning_language: targetLangCode,
        website_language: websiteLanguage,
        current_familiarity: answers.familiarity ?? "",
        digital_comfort: answers.digital ?? "",
      } as any);
      setDone(true);
    } catch (err) {
      setError((err as Error).message || "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
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
            {t("onboarding.setGreeting", { name: answers.name || "friend" })}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("onboarding.setDesc")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate({ to: "/assessment-intro" })}>
              {t("onboarding.continue")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setDone(false);
                setI(0);
              }}
            >
              {t("onboarding.reviewAnswers")}
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
          {t("onboarding.stepText", { current: String(i + 1), total: String(steps.length) })}
        </span>
      </header>
      <div className="px-6">
        <Progress value={pct} className="h-1.5" />
      </div>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {t("onboarding.eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-balance">
          {stepTitle}
        </h1>
        <p className="mt-2 text-muted-foreground">{stepSubtitle}</p>

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
              onValueChange={(v) => {
                setAnswers((a) => {
                  return { ...a, [step.key]: v };
                });
                // Auto-advance if not the last step
                if (i < steps.length - 1) {
                  setTimeout(() => setI(i + 1), 300);
                }
              }}
              className="grid gap-2"
            >
              {currentOptions!.map((opt) => (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${value === opt
                    ? "border-primary bg-primary-soft"
                    : "border-border hover:border-primary/40"
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
            <ArrowLeft className="h-4 w-4" /> {t("onboarding.back")}
          </Button>
          <Button onClick={next} disabled={!canContinue || saving} className="gap-1">
            {i === steps.length - 1 ? (saving ? t("onboarding.saving") : t("onboarding.finish")) : t("onboarding.continue")}{" "}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        {error && (
          <p className="mt-4 text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}

