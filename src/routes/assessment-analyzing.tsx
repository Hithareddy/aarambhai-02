import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { completeAssessment } from "@/lib/api/assessment";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Compass,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAdminGuard } from "@/hooks/use-admin-guard";
import { useLanguage } from "@/hooks/use-language";

const searchSchema = z.object({ s: z.string().optional() });

export const Route = createFileRoute("/assessment-analyzing")({
  head: () => ({
    meta: [
      { title: "Analyzing Your Learning Profile — Aarambh AI" },
      {
        name: "description",
        content:
          "Aarambh AI is analyzing your placement responses to build a personalized learning profile and journey.",
      },
      { property: "og:title", content: "Analyzing Your Learning Profile — Aarambh AI" },
      {
        property: "og:description",
        content: "Your adaptive assessment results are being turned into a personalized learning plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: searchSchema,
  component: AnalyzingPage,
});

const STEP_KEYS = [
  { key: "profile", fallback: "Analyzing your learning profile...", Icon: BrainCircuit },
  { key: "strengths", fallback: "Analyzing your strengths...", Icon: TrendingUp },
  { key: "weaknesses", fallback: "Analyzing areas to improve...", Icon: Target },
  { key: "recommendations", fallback: "Generating personalized recommendations...", Icon: Sparkles },
  { key: "journey", fallback: "Generating your learning journey...", Icon: Compass },
] as const;

const STEP_MS = 1100;

function AnalyzingPage() {
  const { checking } = useAdminGuard();
  const navigate = useNavigate();
  const { s } = Route.useSearch();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [errorState, setErrorState] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (checking) return;

    const sessionId = s || localStorage.getItem("assessment_session_id");
    if (!sessionId) {
      navigate({ to: "/assessment-intro" });
      return;
    }

    let mounted = true;
    let doneAt = 0;

    // Kick off the real computation immediately; the staged animation runs in
    // parallel so the wait feels like analysis rather than a spinner.
    const work = startedRef.current
      ? Promise.resolve()
      : (startedRef.current = true, completeAssessment(sessionId));

    const timer = window.setInterval(() => {
      if (!mounted) return;
      setStep((prev) => {
        const next = Math.min(prev + 1, STEP_KEYS.length - 1);
        if (next === STEP_KEYS.length - 1) doneAt = Date.now();
        return next;
      });
    }, STEP_MS);

    Promise.resolve(work)
      .then(async () => {
        // Let the final stage breathe before revealing the report.
        const minimum = STEP_MS * STEP_KEYS.length;
        const elapsed = Date.now() - (doneAt || Date.now()) + minimum;
        await new Promise((r) => setTimeout(r, Math.max(400, minimum - elapsed + 600)));
        if (!mounted) return;
        window.clearInterval(timer);
        setStep(STEP_KEYS.length - 1);
        navigate({ to: "/assessment-results", search: { s: sessionId } });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        window.clearInterval(timer);
        setErrorState((err as Error)?.message ?? "We could not finish the analysis.");
      });

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [checking, s, navigate]);

  if (checking) return null;

  if (errorState) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-blue-50/50 via-background to-background px-4">
        <Card className="w-full max-w-md rounded-3xl p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-bold">
            {t("assessmentAnalyzing.errorTitle") || "Analysis could not finish"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{errorState}</p>
          <Button className="mt-6 w-full rounded-2xl" onClick={() => navigate({ to: "/assessment-intro" })}>
            {t("assessmentAnalyzing.errorBtn") || "Back to assessment"}
          </Button>
        </Card>
      </main>
    );
  }

  const progress = ((step + 1) / STEP_KEYS.length) * 100;
  const Current = STEP_KEYS[step].Icon;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-blue-50/50 via-background to-background px-4 py-12">
      <Card className="w-full max-w-xl rounded-[2rem] border-border/60 p-8 shadow-xl sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="relative grid h-20 w-20 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
            <span className="absolute inset-2 rounded-full bg-primary/10" />
            <Current className="relative h-9 w-9 text-primary transition-all duration-500" />
          </div>

          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("assessmentAnalyzing.badge") || "Assessment complete"}
          </p>

          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t("assessmentAnalyzing.title") || "Building your learning profile"}
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t("assessmentAnalyzing.subtitle") ||
              "Our AI is reading every answer you gave to design a plan made only for you."}
          </p>

          <Progress value={progress} className="mt-8 h-2 w-full" />
        </div>

        <ol className="mt-8 space-y-3" aria-live="polite">
          {STEP_KEYS.map((item, index) => {
            const done = index < step;
            const active = index === step;
            const Icon = item.Icon;
            return (
              <li
                key={item.key}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-500 ${
                  active
                    ? "border-primary/40 bg-primary/5 opacity-100"
                    : done
                      ? "border-border/50 bg-muted/30 opacity-80"
                      : "border-transparent opacity-40"
                }`}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                    done ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </span>
                <span className={`text-sm ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {t(`assessmentAnalyzing.steps.${item.key}`) || item.fallback}
                </span>
              </li>
            );
          })}
        </ol>
      </Card>
    </main>
  );
}
