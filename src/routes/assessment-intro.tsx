import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeartHandshake, Sparkles, Timer, ArrowRight, ShieldCheck, Smile } from "lucide-react";
import { abandonSession } from "@/lib/api/assessment";
import { useLanguage } from "@/hooks/use-language";
import { useAdminGuard } from "@/hooks/use-admin-guard";

export const Route = createFileRoute("/assessment-intro")({
  head: () => ({ meta: [{ title: "Your Personalized Check-In — Aarambh AI" }] }),
  component: AssessmentIntroPage,
});

function AssessmentIntroPage() {
  const { checking } = useAdminGuard();
  const navigate = useNavigate();
  const { t } = useLanguage();
  if (checking) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20">
      <header className="flex items-center justify-between px-8 py-6">
        <BrandLogo />
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
          <Smile className="h-4 w-4" />
          <span>Zero Anxiety Diagnostic</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        {/* Glowing Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary shadow-sm">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span>{t("assessmentIntro.badge") || "A Friendly Everyday Check-In"}</span>
        </div>

        {/* Hero Title & Description */}
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl text-balance leading-tight">
          {t("assessmentIntro.title") || "Let's discover your learning starting point"}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground text-balance">
          {t("assessmentIntro.description") || "This is not a school exam. There are no grades or failures. Just 15 interactive everyday situations to help us personalize your learning path."}
        </p>

        {/* 3 Feature Cards */}
        <div className="mt-12 grid w-full gap-6 sm:grid-cols-3">
          <Card className="rounded-3xl border-border/60 p-6 text-left shadow-sm transition hover:shadow-md hover:border-primary/40 bg-card/80 backdrop-blur-sm">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Timer className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold">{t("assessmentIntro.card1Title") || "5 to 8 Minutes"}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {t("assessmentIntro.card1Sub") || "Short, engaging activities. Take your time and pause whenever you wish."}
            </p>
          </Card>

          <Card className="rounded-3xl border-border/60 p-6 text-left shadow-sm transition hover:shadow-md hover:border-primary/40 bg-card/80 backdrop-blur-sm">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold">{t("assessmentIntro.card2Title") || "No Pass or Fail"}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {t("assessmentIntro.card2Sub") || "Every attempt gives encouragement. We meet you exactly where you are."}
            </p>
          </Card>

          <Card className="rounded-3xl border-border/60 p-6 text-left shadow-sm transition hover:shadow-md hover:border-primary/40 bg-card/80 backdrop-blur-sm">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold">{t("assessmentIntro.card3Title") || "Adaptive AI Path"}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {t("assessmentIntro.card3Sub") || "Questions adjust to your pace to recommend personalized lessons and games."}
            </p>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Button
            size="lg"
            className="w-full sm:w-auto min-w-[240px] h-14 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 gap-2 bg-primary hover:bg-primary/90"
            onClick={() => {
              abandonSession();
              navigate({ to: "/assessment-quiz" });
            }}
          >
            <span>{t("assessmentIntro.startBtn") || "Start Interactive Experience"}</span>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto h-14 rounded-2xl text-base font-semibold border-border/80"
            onClick={() => navigate({ to: "/onboarding" })}
          >
            {t("assessmentIntro.editBtn") || "Review Onboarding Details"}
          </Button>
        </div>
      </main>
    </div>
  );
}

