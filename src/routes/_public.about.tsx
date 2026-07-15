import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Heart, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/_public/about")({
  head: () => ({
    meta: [
      { title: "About — Aarambh AI" },
      {
        name: "description",
        content: "Aarambh AI was built to make learning accessible to everyone, in every language.",
      },
      { property: "og:title", content: "About Aarambh AI" },
      { property: "og:description", content: "Our mission: learning that adapts to the learner." },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: Heart, title: "Learner-first", copy: "Every decision starts with the learner in the room." },
  { icon: Users, title: "For everyone", copy: "Built for first-timers, seniors, students and beyond." },
  { icon: Sparkles, title: "Thoughtful AI", copy: "AI that guides — never replaces — the human moment." },
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="About"
        title="Learning that meets everyone where they are"
        description="Aarambh means beginning. We're building a place where anyone can begin — in the language they think in, at the pace that fits them."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {values.map((v) => (
          <Card key={v.title} className="p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <v.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{v.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{v.copy}</p>
          </Card>
        ))}
      </div>

      <div className="prose prose-slate mt-14 max-w-none">
        <h2 className="font-display text-2xl font-semibold">Our story</h2>
        <p className="text-muted-foreground">
          Aarambh AI started with a simple observation: most learning tools assume you already know
          how to learn with them. We wanted to build something that could welcome someone opening a
          learning app for the very first time — and still grow with them as they went further.
        </p>
        <p className="text-muted-foreground">
          Today we're focused on multilingual, adaptive learning that respects each learner's time,
          context, and confidence.
        </p>
      </div>
    </div>
  );
}
