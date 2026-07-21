import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeartHandshake, Sparkles, Timer } from "lucide-react";
import { abandonSession } from "@/lib/api/assessment";
import { useLanguage } from "@/hooks/use-language";

export const Route = createFileRoute("/assessment-intro")({
  head: () => ({ meta: [{ title: "Your first check-in — Aarambh AI" }] }),
  component: AssessmentIntroPage,
});

function AssessmentIntroPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <BrandLogo />
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("assessmentIntro.title") || "A gentle first check-in"}
        </h1>
        <p className="mt-3 max-w-xl text-balance text-muted-foreground">
          {t("assessmentIntro.description") || "This is not a test. There is no pass or fail. Just a few friendly questions to help us understand where to begin your journey."}
        </p>

        <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
          <Card className="p-5 text-left">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <Timer className="h-5 w-5" />
            </div>
            <p className="mt-3 font-semibold">{t("assessmentIntro.card1Title") || "About 5 minutes"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("assessmentIntro.card1Sub") || "Take your time. Pause anytime."}</p>
          </Card>
          <Card className="p-5 text-left">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <p className="mt-3 font-semibold">{t("assessmentIntro.card2Title") || "No pass, no fail"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("assessmentIntro.card2Sub") || "There are no wrong answers here."}</p>
          </Card>
          <Card className="p-5 text-left">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="mt-3 font-semibold">{t("assessmentIntro.card3Title") || "Personalised path"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("assessmentIntro.card3Sub") || "A plan built just for you."}</p>
          </Card>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            onClick={() => {
              abandonSession();
              navigate({ to: "/assessment-quiz" });
            }}
          >
            {t("assessmentIntro.startBtn") || "Start assessment"}
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate({ to: "/onboarding" })}>
            {t("assessmentIntro.editBtn") || "Edit my details"}
          </Button>
        </div>
      </main>
    </div>
  );
}
