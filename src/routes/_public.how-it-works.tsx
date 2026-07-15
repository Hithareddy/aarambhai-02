import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_public/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — Aarambh AI" },
      { name: "description", content: "Get started in three gentle steps: choose your language, tell us about you, begin learning." },
      { property: "og:title", content: "How Aarambh AI works" },
      { property: "og:description", content: "Three gentle steps to begin your learning journey." },
    ],
  }),
  component: HowItWorksPage,
});

const steps = [
  { n: "01", title: "Choose your language", copy: "Pick from five languages so the interface feels familiar from the very first tap." },
  { n: "02", title: "Answer a few gentle questions", copy: "No timers. No tests. Just a short conversation to help us understand you." },
  { n: "03", title: "Start your personal path", copy: "We build a plan around your goals. You always stay in control." },
  { n: "04", title: "Learn a little every day", copy: "Streaks, reminders and gentle nudges — never guilt." },
];

function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="How it works"
        title="A calm, guided beginning"
        description="Aarambh AI is easy to start and hard to outgrow. Here's how a typical journey begins."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {steps.map((s) => (
          <Card key={s.n} className="p-6">
            <p className="font-display text-4xl font-semibold text-primary/40">{s.n}</p>
            <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.copy}</p>
          </Card>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/language-selection">Begin now</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/features">See features</Link>
        </Button>
      </div>
    </div>
  );
}
