import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QueryState, CardSkeleton } from "@/components/data-state";
import { EmptyState } from "@/components/empty-state";
import { useDashboard } from "@/lib/api/hooks";
import type { DashboardSnapshot } from "@/lib/api/types";
import { Flame, Clock, Calendar, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_app/progress")({
  head: () => ({ meta: [{ title: "Progress — Aarambh AI" }] }),
  component: ProgressPage,
});

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

function ProgressPage() {
  const query = useDashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress"
        title="Your gentle wins, tracked"
        description="Small progress every day adds up. Here's how yours is shaping up."
      />
      <QueryState
        data={query.data}
        isLoading={query.isLoading}
        error={query.error}
        onRetry={() => query.refetch()}
        skeleton={
          <div className="grid gap-4 sm:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        }
      >
        {(data) => <ProgressContent data={data} />}
      </QueryState>
    </div>
  );
}

function ProgressContent({ data }: { data: DashboardSnapshot }) {
  const { goal, skills, weeklyActivity } = data;
  const week = weeklyActivity.map((d) => d.minutes);
  const maxDay = Math.max(1, ...week);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Streak</p>
              <p className="font-display text-2xl font-semibold">{goal.streakDays} days</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Learning hours
              </p>
              <p className="font-display text-2xl font-semibold">{goal.learningHoursThisWeek}h</p>
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
              <p className="font-display text-2xl font-semibold">{goal.consistencyPercent}%</p>
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
          {week.length > 0 ? (
            <div className="mt-6 flex h-40 items-end gap-3">
              {week.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-primary/80 transition-all"
                    style={{
                      height: `${(v / maxDay) * 100}%`,
                      minHeight: v ? 8 : 4,
                      opacity: v ? 1 : 0.15,
                    }}
                    aria-label={`${v} minutes on ${dayLabels[i % 7]}`}
                  />
                  <span className="text-xs text-muted-foreground">{dayLabels[i % 7]}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              Daily learning activity will appear here as you complete lessons and practice.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold">Skill overview</h2>
          {skills.length > 0 ? (
            <div className="mt-4 space-y-3">
              {skills.map((s) => (
                <div key={s.skill}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{s.skill}</span>
                    <span className="text-muted-foreground">{s.percent}%</span>
                  </div>
                  <Progress value={s.percent} className="mt-1.5 h-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={<BarChart3 className="h-5 w-5" />}
                title="No skill data yet"
                description="Complete your initial assessment to see your skill breakdown."
                action={
                  <Button asChild variant="outline">
                    <Link to="/assessment-quiz">Start assessment</Link>
                  </Button>
                }
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
