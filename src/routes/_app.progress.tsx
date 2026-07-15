import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock, Calendar } from "lucide-react";

export const Route = createFileRoute("/_app/progress")({
  head: () => ({ meta: [{ title: "Progress — Aarambh AI" }] }),
  component: ProgressPage,
});

const week = [3, 5, 2, 8, 6, 0, 4];
const days = ["M", "T", "W", "T", "F", "S", "S"];
const maxDay = Math.max(...week);

function ProgressPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress"
        title="Your gentle wins, tracked"
        description="Small progress every day adds up. Here's how yours is shaping up."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Streak</p>
              <p className="font-display text-2xl font-semibold">4 days</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Learning hours</p>
              <p className="font-display text-2xl font-semibold">6.5h</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <Calendar className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Consistency</p>
              <p className="font-display text-2xl font-semibold">72%</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Weekly activity</h2>
            <Badge variant="secondary">Minutes / day</Badge>
          </div>
          <div className="mt-6 flex h-40 items-end gap-3">
            {week.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-primary/80 transition-all"
                  style={{ height: `${(v / maxDay) * 100}%`, minHeight: v ? 8 : 4, opacity: v ? 1 : 0.15 }}
                  aria-label={`${v} minutes on ${days[i]}`}
                />
                <span className="text-xs text-muted-foreground">{days[i]}</span>
              </div>
            ))}
          </div>
        </Card>

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
      </div>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold">Monthly overview</h2>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 28 }).map((_, i) => {
            const intensity = [0, 0.2, 0.4, 0.6, 0.8, 1][Math.floor(Math.random() * 6)];
            return (
              <div
                key={i}
                className="aspect-square rounded-md"
                style={{ backgroundColor: `color-mix(in oklab, var(--color-primary) ${intensity * 100}%, var(--color-muted))` }}
              />
            );
          })}
        </div>
      </Card>
    </div>
  );
}
