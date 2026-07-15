import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Globe2,
  Mic,
  LineChart,
  Users,
  Sparkles,
  GraduationCap,
  Baby,
  UserRound,
  School,
  Quote,
} from "lucide-react";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "Aarambh AI — Begin Learning, Anytime" },
      {
        name: "description",
        content:
          "Aarambh AI is an adaptive multilingual learning platform that meets learners where they are — first-time learners, students, seniors and lifelong curious minds.",
      },
      { property: "og:title", content: "Aarambh AI — Begin Learning, Anytime" },
      {
        property: "og:description",
        content:
          "Learning that understands where you are, adapts to how you learn, and grows with you.",
      },
    ],
  }),
  component: LandingPage,
});

const audiences = [
  { icon: School, title: "First-generation learners", copy: "Warm, guided experience from step one." },
  { icon: Baby, title: "Young children", copy: "Playful lessons that make curiosity a habit." },
  { icon: UserRound, title: "Senior citizens", copy: "Large, calm interfaces built for comfort." },
  { icon: GraduationCap, title: "Students & adults", copy: "Depth when you want it, at your pace." },
];

const features = [
  {
    icon: Brain,
    title: "Personalized learning",
    copy: "Every lesson adapts to your goals, pace, and prior knowledge.",
  },
  {
    icon: Sparkles,
    title: "Adaptive assessment",
    copy: "No pass, no fail — just a smart starting point that fits you.",
  },
  {
    icon: Globe2,
    title: "Multilingual by design",
    copy: "Learn in English, తెలుగు, हिन्दी, தமிழ் or मराठी.",
  },
  {
    icon: Mic,
    title: "Voice-first learning",
    copy: "Speak and listen — perfect for early readers and new devices.",
  },
  {
    icon: LineChart,
    title: "Progress you can see",
    copy: "Gentle streaks, skill maps, and weekly reports.",
  },
  {
    icon: Users,
    title: "Learn together",
    copy: "Ask questions, share wins, and grow with a community.",
  },
];

const steps = [
  { n: "01", title: "Pick your language", copy: "Choose the language that feels like home." },
  { n: "02", title: "Tell us about you", copy: "A few gentle questions — no test, no pressure." },
  { n: "03", title: "Start your path", copy: "Get a plan built just for you and begin learning." },
];

function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered adaptive learning
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl">
              Begin Learning, <span className="text-primary">Anytime</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground text-balance">
              Learning that understands where you are, adapts to how you learn, and grows with you —
              in the language that feels most like home.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/language-selection">
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/language-selection">Choose language</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/how-it-works">Learn more</Link>
              </Button>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-6 text-sm">
              <Stat value="5" label="Languages" />
              <Stat value="No test" label="To start" />
              <Stat value="Every age" label="Welcome" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 blur-2xl" />
            <Card className="relative overflow-hidden rounded-[2rem] border-border/70 p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Today's lesson</p>
                  <p className="font-display text-base font-semibold">Reading confidence — Day 3</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <SkillRow label="Listening" pct={72} />
                <SkillRow label="Speaking" pct={54} />
                <SkillRow label="Reading" pct={81} />
                <SkillRow label="Writing" pct={40} />
              </div>
              <div className="mt-6 rounded-xl bg-primary-soft p-4 text-sm text-primary">
                <p className="font-medium">You're on a 4-day streak. Keep going!</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Why Aarambh AI</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Learning shaped around the learner
          </h2>
          <p className="mt-3 text-muted-foreground">
            Instead of pushing everyone through the same curriculum, Aarambh AI listens, adapts, and
            builds a path that respects your time, language, and pace.
          </p>
        </div>
      </section>

      {/* Audiences */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Who Aarambh AI is for
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a) => (
            <Card key={a.title} className="p-6 transition-shadow hover:shadow-md">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
                <a.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{a.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{a.copy}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Features</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Thoughtful tools, gentle progress
            </h2>
          </div>
          <Button asChild variant="ghost" className="gap-1">
            <Link to="/features">
              See all features <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.copy}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/60 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">How it works</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Three gentle steps
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6">
                <span className="font-display text-4xl font-semibold text-primary/30">{s.n}</span>
                <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <Quote className="mx-auto h-8 w-8 text-primary" />
        <p className="mt-4 font-display text-2xl font-medium tracking-tight text-balance sm:text-3xl">
          "It feels like the app is listening to me. My grandmother is learning to read English on her own now."
        </p>
        <p className="mt-4 text-sm text-muted-foreground">Early learner family — pilot program</p>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground shadow-xl sm:p-14">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Your first lesson is waiting.
              </h2>
              <p className="mt-3 max-w-xl text-primary-foreground/80">
                Choose your language, tell us a little about yourself, and start with a lesson built for you.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/language-selection">Get started</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SkillRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
