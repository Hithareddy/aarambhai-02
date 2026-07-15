import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import {
  ArrowRight,
  BookOpen,
  Bell,
  Flame,
  ClipboardCheck,
  Trophy,
  Sparkles,
  PlayCircle,
} from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Aarambh AI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card className="gradient-hero grid gap-6 rounded-2xl border-none p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Welcome back</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to learn a little today?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A calm 10 minutes goes a long way. Pick up right where you left off.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link to="/learn"><PlayCircle className="h-4 w-4" /> Continue learning</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/learning-path">View path</Link>
          </Button>
        </div>
      </Card>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Flame} label="Learning streak" value="4 days" hint="Keep it going" />
        <StatCard icon={BookOpen} label="Today's goal" value="10 / 20 min" hint="You're halfway there" progress={50} />
        <StatCard icon={ClipboardCheck} label="Assessments" value="1 completed" hint="Try a practice check" />
        <StatCard icon={Trophy} label="Badges earned" value="3" hint="2 new badges await" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Current path + upcoming */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Current path</p>
                <h2 className="mt-1 font-display text-lg font-semibold">Everyday English</h2>
              </div>
              <Badge variant="secondary" className="shrink-0">Beginner</Badge>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Chapter 3 of 12</span>
                <span>28%</span>
              </div>
              <Progress value={28} className="mt-2 h-2" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <PathLesson title="Greetings & introductions" status="done" />
              <PathLesson title="Numbers & counting" status="done" />
              <PathLesson title="Ordering food" status="current" />
              <PathLesson title="Asking directions" status="locked" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Upcoming lessons</h2>
              <Button asChild variant="ghost" size="sm" className="gap-1">
                <Link to="/learning-path">See path <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {["Ordering food (10 min)", "Small talk basics (8 min)", "Numbers 1–100 (12 min)"].map((t) => (
                <li key={t} className="flex items-center justify-between py-3">
                  <span className="text-sm">{t}</span>
                  <Button size="sm" variant="ghost">Start</Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold">Skill overview</h2>
            <div className="mt-4 space-y-3">
              {[
                { l: "Listening", p: 72 },
                { l: "Speaking", p: 54 },
                { l: "Reading", p: 81 },
                { l: "Writing", p: 40 },
              ].map((s) => (
                <div key={s.l}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{s.l}</span>
                    <span className="text-muted-foreground">{s.p}%</span>
                  </div>
                  <Progress value={s.p} className="mt-1.5 h-2" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold">Try your first assessment</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  A gentle check-in so we can fine-tune your path.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/assessment-intro">Start</Link>
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Notifications</h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/notifications">View all</Link>
              </Button>
            </div>
            <EmptyState
              className="mt-4 border-none bg-transparent px-0 py-6"
              icon={<Bell className="h-5 w-5" />}
              title="You're all caught up"
              description="New reminders and wins will appear here."
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  progress,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  hint?: string;
  progress?: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      {typeof progress === "number" && <Progress value={progress} className="mt-3 h-1.5" />}
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function PathLesson({ title, status }: { title: string; status: "done" | "current" | "locked" }) {
  const style =
    status === "done"
      ? "border-success/40 bg-success/10 text-success"
      : status === "current"
      ? "border-primary/50 bg-primary-soft text-primary"
      : "border-border bg-muted text-muted-foreground";
  return (
    <div className={`rounded-xl border px-4 py-3 ${style}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
        {status === "done" ? "Completed" : status === "current" ? "Now" : "Locked"}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{title}</p>
    </div>
  );
}
