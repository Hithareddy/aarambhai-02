import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Brain, Sparkles, Globe2, Mic, LineChart, Users, ShieldCheck, Accessibility } from "lucide-react";

export const Route = createFileRoute("/_public/features")({
  head: () => ({
    meta: [
      { title: "Features — Aarambh AI" },
      { name: "description", content: "Every feature in Aarambh AI is designed to make learning gentler, clearer and more personal." },
      { property: "og:title", content: "Features — Aarambh AI" },
      { property: "og:description", content: "Personalized, multilingual, voice-first learning." },
    ],
  }),
  component: FeaturesPage,
});

const features = [
  { icon: Brain, title: "Personalized learning", copy: "Content shaped by your goals, comfort and pace." },
  { icon: Sparkles, title: "Adaptive assessment", copy: "A gentle starting-point check — no pass, no fail." },
  { icon: Globe2, title: "Multilingual by design", copy: "English, తెలుగు, हिन्दी, தமிழ், मराठी and more coming." },
  { icon: Mic, title: "Voice-first learning", copy: "Speak, listen and learn — great for new readers." },
  { icon: LineChart, title: "Progress tracking", copy: "Streaks, skill maps and weekly gentle reports." },
  { icon: Users, title: "Community", copy: "Learn alongside others without pressure." },
  { icon: ShieldCheck, title: "Safe & private", copy: "Your learning journey is yours. Full stop." },
  { icon: Accessibility, title: "Accessibility first", copy: "Large text, high contrast, motion controls." },
];

function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Features"
        title="Every detail, for the learner"
        description="From your first tap to your hundredth lesson, Aarambh AI is designed to feel calm, clear, and personal."
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="p-6 transition-shadow hover:shadow-md">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.copy}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
