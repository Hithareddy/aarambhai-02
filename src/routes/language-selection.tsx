import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { LANGUAGES, LanguageCode } from "@/constants/languages";

export const Route = createFileRoute("/language-selection")({
  head: () => ({
    meta: [{ title: "Choose your language — Aarambh AI" }],
  }),
  component: LanguageSelectionPage,
});

function LanguageSelectionPage() {
  const { websiteLanguage, setWebsiteLanguage, t } = useLanguage();
  const [picked, setPicked] = useState<LanguageCode>(websiteLanguage);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <BrandLogo />
        <Button asChild variant="ghost" size="sm">
          <Link to="/">{t("languageSelection.backToHome") || "Back to home"}</Link>
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {t("languageSelection.stepText") || "Step 1 of 2"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("languageSelection.title") || "Choose your language"}
        </h1>
        <p className="mt-2 max-w-xl text-center text-muted-foreground">
          {t("languageSelection.desc") || "Aarambh AI will speak your language — pick the one that feels most at home."}
        </p>

        <div className="mt-10 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANGUAGES.map((l) => {
            const active = picked === l.code;
            return (
              <button
                key={l.code}
                onClick={() => {
                  setPicked(l.code as LanguageCode);
                  // Update website language immediately so the header back link translates reactively
                  setWebsiteLanguage(l.code as LanguageCode);
                }}
                className={`group relative rounded-2xl border-2 bg-card p-6 text-left transition ${active ? "border-primary shadow-md" : "border-border hover:border-primary/40"
                  }`}
              >
                <p className="font-display text-2xl font-semibold">{l.native}</p>
                <p className="mt-1 text-sm text-muted-foreground">{l.label}</p>
                {active && (
                  <span className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Button
          size="lg"
          className="mt-10"
          onClick={() => {
            setWebsiteLanguage(picked);
            navigate({ to: "/role-selection" });
          }}
        >
          {t("onboarding.continue") || "Continue"}
        </Button>
      </main>
    </div>
  );
}
