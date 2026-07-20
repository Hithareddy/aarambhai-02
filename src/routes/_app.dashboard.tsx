import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  Medal,
  PlayCircle,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import { QueryState } from "@/components/data-state";
import { useDashboard, useMarkAllNotificationsRead } from "@/lib/api/hooks";
import type {
  AchievementBadge,
  ActivityDay,
  ContinueLesson,
  DashboardSnapshot,
  NotificationItem,
  RecommendedLesson,
  SkillMastery,
  TopicInsight,
  UpcomingAssessment,
} from "@/lib/api/types";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Aarambh AI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const query = useDashboard();

  return (
    <QueryState
      data={query.data}
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => query.refetch()}
      skeleton={<DashboardSkeleton />}
    >
      {(data) => <DashboardContent data={data} />}
    </QueryState>
  );
}

function DashboardContent({ data }: { data: DashboardSnapshot }) {
  const {
    profile,
    goal,
    weeklyActivity,
    monthlyActivity,
    skills,
    weakTopics,
    strongTopics,
    continueLesson,
    recommendations,
    recentlyCompleted,
    upcomingAssessments,
    achievements,
    notifications,
    activityFeed,
    courseCompletionPercent,
  } = data;

  const xpPct = Math.min(100, Math.round((profile.xp / profile.xpForNextLevel) * 100));
  const goalPct = Math.min(100, Math.round((goal.completedMinutes / goal.targetMinutes) * 100));

  return (
    <div className="space-y-6">
      <WelcomeHero
        name={profile.name}
        headline={profile.headline}
        level={profile.level}
        xp={profile.xp}
        xpForNextLevel={profile.xpForNextLevel}
        xpPct={xpPct}
        streak={goal.streakDays}
      />

      <QuickActions />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Streak"
          value={`${goal.streakDays} days`}
          hint={`Longest ${goal.longestStreak} days`}
          tone="primary"
        />
        <StatCard
          icon={Target}
          label="Today's goal"
          value={`${goal.completedMinutes}/${goal.targetMinutes} min`}
          hint={goalPct >= 100 ? "Goal complete" : `${100 - goalPct}% to go`}
          progress={goalPct}
          tone="accent"
        />
        <StatCard
          icon={Zap}
          label="Weekly time"
          value={`${goal.learningHoursThisWeek}h`}
          hint={`${goal.consistencyPercent}% consistency`}
          tone="primary"
        />
        <StatCard
          icon={BookOpen}
          label="Course progress"
          value={`${courseCompletionPercent}%`}
          hint="Everyday English"
          progress={courseCompletionPercent}
          tone="accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {continueLesson && <ContinueLessonCard lesson={continueLesson} />}
          <WeeklyActivityCard data={weeklyActivity} />
          <MonthlyActivityCard data={monthlyActivity} />
          <AIRecommendationsCard items={recommendations} />
          <TopicsCard weak={weakTopics} strong={strongTopics} />
          <RecentlyCompletedCard items={recentlyCompleted} />
        </div>

        <div className="space-y-6">
          <SkillOverviewCard skills={skills} />
          <UpcomingAssessmentsCard items={upcomingAssessments} />
          <AchievementsCard items={achievements} />
          <NotificationsCard items={notifications} />
          <ActivityTimelineCard items={activityFeed} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- SECTIONS -------------------------------- */

function WelcomeHero({
  name,
  headline,
  level,
  xp,
  xpForNextLevel,
  xpPct,
  streak,
}: {
  name: string;
  headline: string;
  level: number;
  xp: number;
  xpForNextLevel: number;
  xpPct: number;
  streak: number;
}) {
  const firstName = name.split(" ")[0];
  return (
    <Card className="gradient-hero relative overflow-hidden rounded-2xl border-none p-6 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Welcome back
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Good to see you, {firstName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{headline}</p>
          <div className="mt-5 max-w-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Level {level}</span>
              <span className="text-muted-foreground">
                {xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
              </span>
            </div>
            <Progress value={xpPct} className="mt-1.5 h-2" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {xpForNextLevel - xp} XP to Level {level + 1}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <Badge className="gap-1 bg-primary-soft text-primary hover:bg-primary-soft">
            <Flame className="h-3.5 w-3.5" /> {streak}-day streak
          </Badge>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg" className="gap-2">
              <Link to="/learn">
                <PlayCircle className="h-4 w-4" /> Continue learning
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/learning-path">View path</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    { to: "/learn" as const, icon: BookOpen, label: "Browse lessons" },
    { to: "/practice" as const, icon: Zap, label: "Quick practice" },
    { to: "/assessments" as const, icon: ClipboardCheck, label: "Take assessment" },
    { to: "/progress" as const, icon: TrendingUp, label: "See progress" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((a) => (
        <Button
          key={a.to}
          asChild
          variant="outline"
          className="h-auto justify-start gap-2 rounded-xl py-3"
        >
          <Link to={a.to}>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
              <a.icon className="h-4 w-4" />
            </span>
            <span className="truncate text-sm font-medium">{a.label}</span>
          </Link>
        </Button>
      ))}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  progress,
  tone = "primary",
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  hint?: string;
  progress?: number;
  tone?: "primary" | "accent";
}) {
  const iconBg =
    tone === "accent"
      ? "bg-accent-soft text-accent"
      : "bg-primary-soft text-primary";
  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${iconBg}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {typeof progress === "number" && (
        <Progress value={progress} className="mt-3 h-1.5" />
      )}
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function ContinueLessonCard({ lesson }: { lesson: ContinueLesson }) {
  return (
    <Card className="overflow-hidden p-0">
      <div
        className="p-6 text-primary-foreground"
        style={{
          backgroundImage: `linear-gradient(135deg, ${lesson.gradientFrom}, ${lesson.gradientTo})`,
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
          Continue where you left off
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold sm:text-2xl">
          {lesson.lessonTitle}
        </h2>
        <p className="mt-1 text-sm opacity-90">
          {lesson.courseTitle} · {lesson.chapter}
        </p>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{lesson.progress}% complete</span>
          <span>{lesson.minutesLeft} min left</span>
        </div>
        <Progress value={lesson.progress} className="mt-2 h-2" />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/learning-path">View chapter</Link>
          </Button>
          <Button asChild size="sm" className="gap-1">
            <Link to="/learn">
              Resume <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function WeeklyActivityCard({ data }: { data: ActivityDay[] }) {
  const chart = data.map((d) => ({
    day: new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }),
    minutes: d.minutes,
  }));
  const total = data.reduce((sum, d) => sum + d.minutes, 0);
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">This week</h2>
          <p className="text-xs text-muted-foreground">
            {total} minutes of learning across 7 days
          </p>
        </div>
        <Badge variant="secondary">Minutes / day</Badge>
      </div>
      <div className="mt-5 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="weekFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" fontSize={12} width={30} />
            <Tooltip content={<ChartTooltip suffix=" min" />} cursor={{ stroke: "var(--color-border)" }} />
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fill="url(#weekFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function MonthlyActivityCard({ data }: { data: ActivityDay[] }) {
  const chart = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { day: "2-digit" }),
    minutes: d.minutes,
  }));
  const total = data.reduce((sum, d) => sum + d.minutes, 0);
  const activeDays = data.filter((d) => d.minutes > 0).length;
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">Last 28 days</h2>
          <p className="text-xs text-muted-foreground">
            {activeDays} active days · {Math.round(total / 60)}h {total % 60}m total
          </p>
        </div>
        <Badge variant="secondary">Daily minutes</Badge>
      </div>
      <div className="mt-5 h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              interval={3}
            />
            <YAxis tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" fontSize={11} width={30} />
            <Tooltip content={<ChartTooltip suffix=" min" />} cursor={{ fill: "color-mix(in oklab, var(--color-primary) 8%, transparent)" }} />
            <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
              {chart.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.minutes > 0 ? "var(--color-primary)" : "var(--color-muted)"}
                  opacity={entry.minutes > 0 ? 0.85 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{label}</p>
      <p className="mt-0.5 text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">
          {payload[0].value}
        </span>
        {suffix}
      </p>
    </div>
  );
}

function AIRecommendationsCard({ items }: { items: RecommendedLesson[] }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft text-accent">
            <Sparkles className="h-4 w-4" />
          </span>
          <h2 className="font-display text-lg font-semibold">AI recommendations</h2>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/learn">
            Explore <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((r) => (
          <div
            key={r.id}
            className="group flex flex-col rounded-xl border border-border bg-card/70 p-4 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary">{r.category}</Badge>
              <span className="text-xs text-muted-foreground tabular-nums">
                {r.durationMinutes} min
              </span>
            </div>
            <h3 className="mt-3 font-display text-base font-semibold">{r.title}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{r.reason}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{r.difficulty}</span>
              <Button asChild size="sm" variant="ghost" className="gap-1">
                <Link to="/practice">
                  Start <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TopicsCard({
  weak,
  strong,
}: {
  weak: TopicInsight[];
  strong: TopicInsight[];
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <TopicList title="Areas to nurture" icon={<TrendingDown className="h-4 w-4 text-warning" />} items={weak} />
      <TopicList title="Your strengths" icon={<TrendingUp className="h-4 w-4 text-success" />} items={strong} />
    </div>
  );
}

function TopicList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: TopicInsight[];
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted">{icon}</span>
        <h2 className="font-display text-base font-semibold">{title}</h2>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((t) => (
          <li key={t.topic}>
            <div className="flex items-center justify-between text-sm">
              <span className="truncate pr-2 font-medium">{t.topic}</span>
              <span
                className={`shrink-0 tabular-nums text-xs ${
                  t.delta >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {t.delta >= 0 ? "+" : ""}
                {t.delta}%
              </span>
            </div>
            <Progress value={t.mastery} className="mt-1.5 h-1.5" />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RecentlyCompletedCard({ items }: { items: DashboardSnapshot["recentlyCompleted"] }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Recently completed</h2>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/progress">
            History <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {items.map((c) => (
          <li key={c.id} className="flex items-center gap-3 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-success/15 text-success">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {c.courseTitle} · {relativeTime(c.completedAt)}
              </p>
            </div>
            <span className="shrink-0 tabular-nums text-sm font-semibold">{c.score}%</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SkillOverviewCard({ skills }: { skills: SkillMastery[] }) {
  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-semibold">Skill overview</h2>
      <div className="mt-4 space-y-3">
        {skills.map((s) => (
          <div key={s.skill}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{s.skill}</span>
              <span className="tabular-nums text-muted-foreground">{s.percent}%</span>
            </div>
            <Progress value={s.percent} className="mt-1.5 h-2" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function UpcomingAssessmentsCard({ items }: { items: UpcomingAssessment[] }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Upcoming assessments</h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/assessments">All</Link>
        </Button>
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-3 rounded-xl border border-border p-3"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <ClipboardCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {relativeTime(a.scheduledFor)} · {a.durationMinutes} min
              </p>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link to="/assessment-quiz">Start</Link>
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AchievementsCard({ items }: { items: AchievementBadge[] }) {
  const iconFor = {
    flame: Flame,
    trophy: Trophy,
    sparkles: Sparkles,
    target: Target,
    medal: Medal,
    star: Star,
  } as const;
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Achievements</h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/achievements">All</Link>
        </Button>
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((b) => {
          const Icon = iconFor[b.icon];
          const earned = Boolean(b.earnedAt);
          return (
            <li key={b.id} className="flex items-start gap-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                  earned ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.title}</p>
                <p className="truncate text-xs text-muted-foreground">{b.description}</p>
                {!earned && typeof b.progress === "number" && typeof b.target === "number" && (
                  <div className="mt-1.5">
                    <Progress value={(b.progress / b.target) * 100} className="h-1.5" />
                    <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                      {b.progress}/{b.target}
                    </p>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function NotificationsCard({ items }: { items: NotificationItem[] }) {
  const markAll = useMarkAllNotificationsRead();
  const unread = items.filter((n) => !n.read).length;
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold">Notifications</h2>
          {unread > 0 && (
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">
              {unread}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <Button
              size="sm"
              variant="ghost"
              disabled={markAll.isPending}
              onClick={() =>
                markAll.mutate(undefined, {
                  onSuccess: () => toast.success("All notifications marked as read"),
                  onError: () => toast.error("Couldn't update notifications"),
                })
              }
            >
              Mark all
            </Button>
          )}
          <Button asChild size="sm" variant="ghost">
            <Link to="/notifications">All</Link>
          </Button>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border py-8 text-center">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">You're all caught up.</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.slice(0, 3).map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-3 ${
                n.read ? "border-border" : "border-primary/30 bg-primary-soft/40"
              }`}
            >
              <div className="flex items-start gap-2">
                {!n.read && (
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.description}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {relativeTime(n.createdAt)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ActivityTimelineCard({ items }: { items: DashboardSnapshot["activityFeed"] }) {
  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-semibold">Recent activity</h2>
      <ol className="mt-4 space-y-4 border-l border-border pl-4">
        {items.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
            <p className="text-sm">{e.message}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(e.timestamp)}</p>
          </li>
        ))}
      </ol>
      <Separator className="my-4" />
      <Button asChild variant="ghost" size="sm" className="w-full">
        <Link to="/progress">View full history</Link>
      </Button>
    </Card>
  );
}

/* --------------------------------- UTIL ---------------------------------- */

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.round((now - then) / 60_000);
  if (Math.abs(diffMin) < 1) return "just now";
  if (Math.abs(diffMin) < 60) return diffMin > 0 ? `${diffMin}m ago` : `in ${-diffMin}m`;
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return diffH > 0 ? `${diffH}h ago` : `in ${-diffH}h`;
  const diffD = Math.round(diffH / 24);
  return diffD > 0 ? `${diffD}d ago` : `in ${-diffD}d`;
}

/* ------------------------------- SKELETON -------------------------------- */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
