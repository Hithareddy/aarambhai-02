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
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Clock,
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
import { useActivitySummary, useDashboard, useMarkAllNotificationsRead, useTodaysLearning } from "@/lib/api/hooks";
import { useLanguage } from "@/hooks/use-language";
import { DailyGoalModal } from "@/components/daily-goal-modal";
import { LearningCalendar } from "@/components/learning-calendar";
import { LearningCompanions } from "@/components/learning-companions";
import { LearningActivityCard } from "@/components/learning-activity-card";
import { StreakCard } from "@/components/streak-card";
import { WordOfTheDayCard } from "@/components/word-of-the-day-card";
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
  const { websiteLanguage, t } = useLanguage();
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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Flame}
          label={t("dashboard.streak") || "Streak"}
          value={`${goal.streakDays} ${t("dashboard.days") || "days"}`}
          hint={`${t("dashboard.longestStreak") || "Longest"} ${goal.longestStreak} ${t("dashboard.days") || "days"}`}
          tone="primary"
        />
        <StatCard
          icon={Zap}
          label={t("dashboard.weeklyTime") || "Weekly time"}
          value={`${goal.learningHoursThisWeek}h`}
          hint={`${goal.consistencyPercent}% ${t("dashboard.consistency") || "consistency"}`}
          tone="primary"
        />
        <StatCard
          icon={BookOpen}
          label={t("dashboard.courseProgress") || "Course progress"}
          value={`${courseCompletionPercent}%`}
          hint={t("dashboard.courseEnglish") || "Everyday English"}
          progress={courseCompletionPercent}
          tone="accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* MAIN / LEFT COLUMN — Primary Learning Content */}
        <div className="space-y-6 min-w-0">
          <TodaysLearningWidget />
          <ActiveLearningTimeCard />
          <LearningActivityCard weeklyData={weeklyActivity} monthlyData={monthlyActivity} />
          <AIRecommendationsCard items={recommendations} />
          <TopicsCard weak={weakTopics} strong={strongTopics} />
        </div>

        {/* RIGHT COLUMN — Consistency & Quick Information */}
        <div className="space-y-6 min-w-0">
          <StreakCard initialStreakDays={goal.streakDays} initialLongestStreak={goal.longestStreak} />
          <DashboardDailyGoalCard targetMinutesDefault={goal.targetMinutes || 20} />
          <LearningCalendar />
          <SkillOverviewCard skills={skills} />
          <WordOfTheDayCard />
          <UpcomingAssessmentsCard items={upcomingAssessments} />
          <AchievementsCard items={achievements} />
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
  const { t } = useLanguage();
  const firstName = name.split(" ")[0];
  return (
    <Card className="gradient-hero relative overflow-hidden rounded-2xl border-none p-6 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {t("dashboard.welcomeBack") || "Welcome back"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("dashboard.greeting", { name: firstName }) || `Good to see you, ${firstName}`}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{headline}</p>
          <div className="mt-5 max-w-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{t("dashboard.level", { level: String(level) }) || `Level ${level}`}</span>
              <span className="text-muted-foreground">
                {xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
              </span>
            </div>
            <Progress value={xpPct} className="mt-1.5 h-2" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("dashboard.xpToNext", { xp: String(xpForNextLevel - xp), level: String(level + 1) }) || `${xpForNextLevel - xp} XP to Level ${level + 1}`}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <Badge className="gap-1 bg-primary-soft text-primary hover:bg-primary-soft">
            <Flame className="h-3.5 w-3.5" /> {t("dashboard.streakCount", { count: String(streak) }) || `${streak}-day streak`}
          </Badge>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg" className="gap-2">
              <Link to="/learn">
                <PlayCircle className="h-4 w-4" /> {t("dashboard.continueLearning") || "Continue learning"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/learning-path">{t("dashboard.viewPathHero") || "View path"}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Tiny animated mascots — absolutely positioned, zero layout impact */}
      <LearningCompanions />
    </Card>
  );
}

function QuickActions() {
  const { t } = useLanguage();
  const actions = [
    { to: "/learn" as const, icon: BookOpen, label: t("dashboard.browseLessons") || "Browse lessons" },
    { to: "/practice" as const, icon: Zap, label: t("dashboard.quickPractice") || "Quick practice" },
    { to: "/assessments" as const, icon: ClipboardCheck, label: t("dashboard.takeAssessment") || "Take assessment" },
    { to: "/progress" as const, icon: TrendingUp, label: t("dashboard.seeProgress") || "See progress" },
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

function TodaysLearningWidget() {
  const { t } = useLanguage();
  const query = useTodaysLearning();

  if (query.isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  if (!query.data || query.isError) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Couldn't fetch your daily learning plan.
      </Card>
    );
  }

  const { activities, module_context, estimated_time } = query.data;

  return (
    <Card className="overflow-hidden p-0 border border-primary/20">
      <div className="p-6 text-primary-foreground bg-gradient-to-br from-primary to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80 mb-1">
            {t("dashboard.todays_learning") || "Today's Learning"}
          </p>
          <h2 className="font-display text-xl font-semibold sm:text-2xl">
            {module_context || "Personalized Sequence"}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm opacity-90">
            <Sparkles className="h-4 w-4" />
            {activities.length} activities • {estimated_time || "10 mins"}
          </p>
        </div>
      </div>
      <div className="p-0 border-t border-border">
        <ul className="divide-y divide-border/50">
          {activities.slice(0, 3).map((act: any, i: number) => (
            <li key={act.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{act.title}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{act.activity_type}</p>
              </div>
              <div className="shrink-0 text-xs text-amber-500 font-semibold flex items-center gap-1">
                <Flame className="w-3 h-3" /> {act.rewards?.xp || 10} XP
              </div>
            </li>
          ))}
          {activities.length > 3 && (
            <li className="p-3 text-center text-xs text-muted-foreground italic">
              + {activities.length - 3} more activities
            </li>
          )}
        </ul>
      </div>
      <div className="p-4 bg-muted/20 border-t border-border/50">
        <Button asChild className="w-full shadow-sm hover:translate-y-[-1px] transition-transform">
          <Link to="/practice">
            {t("dashboard.start_learning") || "Start Learning"} <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
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
  const { t } = useLanguage();
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft text-accent">
            <Sparkles className="h-4 w-4" />
          </span>
          <h2 className="font-display text-lg font-semibold">{t("dashboard.aiRecommendations") || "AI recommendations"}</h2>
        </div>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/learn">
            {t("dashboard.explore") || "Explore"} <ArrowRight className="h-4 w-4" />
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
  const { t } = useLanguage();
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <TopicList title={t("dashboard.weakTopicsTitle") || "Areas to nurture"} icon={<TrendingDown className="h-4 w-4 text-warning" />} items={weak} />
      <TopicList title={t("dashboard.strongTopicsTitle") || "Your strengths"} icon={<TrendingUp className="h-4 w-4 text-success" />} items={strong} />
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
                className={`shrink-0 tabular-nums text-xs ${t.delta >= 0 ? "text-success" : "text-destructive"
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
  const { t } = useLanguage();
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">{t("dashboard.recentlyCompleted") || "Recently completed"}</h2>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/progress">
            {t("dashboard.history") || "History"} <ArrowRight className="h-4 w-4" />
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
  const { t } = useLanguage();
  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-semibold">{t("dashboard.skillOverview") || "Skill overview"}</h2>
      <div className="mt-4 space-y-4">
        {skills.map((s) => {
          // Sprint 10.1 5-star confidence calculation
          const activeStars = Math.min(5, Math.max(1, Math.round(s.percent / 20)));
          return (
            <div key={s.skill} className="flex items-center justify-between">
              <span className="text-sm font-medium">{s.skill}</span>
              <div className="flex gap-0.5" title={`${s.percent}% Mastery`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < activeStars ? "fill-primary text-primary" : "fill-muted text-muted"}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function UpcomingAssessmentsCard({ items }: { items: UpcomingAssessment[] }) {
  const { t } = useLanguage();
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">{t("dashboard.upcomingAssessments") || "Upcoming assessments"}</h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/assessments">{t("dashboard.all") || "All"}</Link>
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
              <Link to="/assessment-quiz">{t("dashboard.start") || "Start"}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AchievementsCard({ items }: { items: AchievementBadge[] }) {
  const { t } = useLanguage();
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
        <h2 className="font-display text-lg font-semibold">{t("dashboard.achievements") || "Achievements"}</h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/achievements">{t("dashboard.all") || "All"}</Link>
        </Button>
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((b) => {
          const Icon = iconFor[b.icon];
          const earned = Boolean(b.earnedAt);
          return (
            <li key={b.id} className="flex items-start gap-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${earned ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground"
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
  const { t } = useLanguage();
  const markAll = useMarkAllNotificationsRead();
  const unread = items.filter((n) => !n.read).length;
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold">{t("dashboard.notifications") || "Notifications"}</h2>
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
                  onSuccess: () => toast.success(t("dashboard.notificationsMarkedRead") || "All notifications marked as read"),
                  onError: () => toast.error(t("dashboard.notificationsMarkedError") || "Couldn't update notifications"),
                })
              }
            >
              {t("dashboard.markAll") || "Mark all"}
            </Button>
          )}
          <Button asChild size="sm" variant="ghost">
            <Link to="/notifications">{t("dashboard.all") || "All"}</Link>
          </Button>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-border py-8 text-center">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">{t("dashboard.allCaughtUp") || "You're all caught up."}</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.slice(0, 3).map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border p-3 ${n.read ? "border-border" : "border-primary/30 bg-primary-soft/40"
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
  const { t } = useLanguage();
  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-semibold">{t("dashboard.recentActivity") || "Recent activity"}</h2>
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
        <Link to="/progress">{t("dashboard.viewFullHistory") || "View full history"}</Link>
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

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0 min";
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

function ActiveLearningTimeCard() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const { data: summary, isLoading } = useActivitySummary(period);

  const categoryColorMap: Record<string, string> = {
    lessons: "bg-blue-500",
    assessment: "bg-purple-500",
    games: "bg-emerald-500",
    ai_tutor: "bg-amber-500",
    general: "bg-slate-400",
  };

  const periodLabel = period === "today" ? "today" : period === "week" ? "this week" : "this month";

  return (
    <Card className="p-6 border border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Today's Learning Time</h2>
            <p className="text-xs text-muted-foreground">Accurate active learning duration</p>
          </div>
        </div>

        {/* Period Filter Controls */}
        <div className="flex items-center rounded-lg bg-muted p-1 text-xs font-medium">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 transition-all ${
                period === p
                  ? "bg-background font-semibold text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 h-32 w-full rounded-xl" />
      ) : !summary || summary.total_active_seconds === 0 ? (
        /* Empty / Zero State */
        <div className="my-6 rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
          <Clock className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
          <p className="font-display text-xl font-semibold text-foreground">0 min {periodLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            No active learning time recorded yet for {periodLabel}. Start a lesson, game, or assessment to begin tracking!
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight text-foreground">
              {formatDuration(summary.total_active_seconds)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">{periodLabel}</span>
          </div>

          {/* Category Breakdown Bars */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Category Breakdown
            </p>
            {summary.categories.map((cat) => {
              const pct =
                summary.total_active_seconds > 0
                  ? Math.round((cat.seconds / summary.total_active_seconds) * 100)
                  : 0;
              const colorClass = categoryColorMap[cat.category] || "bg-primary";

              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <span className={`inline-block h-2 w-2 rounded-full ${colorClass}`} />
                      {cat.label}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatDuration(cat.seconds)} ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function DashboardDailyGoalCard({ targetMinutesDefault = 20 }: { targetMinutesDefault?: number }) {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: todaySummary } = useActivitySummary("today");

  const targetMinutes = todaySummary?.current_goal_minutes || targetMinutesDefault;
  const eligibleSeconds = todaySummary?.today_goal_eligible_seconds ?? 0;
  const eligibleMinutes = Math.floor(eligibleSeconds / 60);
  const isCompleted = todaySummary?.today_goal_completed ?? (eligibleMinutes >= targetMinutes);
  const bonusMinutes = todaySummary?.today_bonus_learning_minutes ?? Math.max(0, eligibleMinutes - targetMinutes);
  const progressPct = Math.min(100, Math.round((eligibleMinutes / targetMinutes) * 100));

  return (
    <>
      <Card className={`p-4 transition-all ${isCompleted ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10" : ""}`}>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isCompleted ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-primary/10 text-primary"}`}>
              <Target className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                {t("dashboard.todayGoal") || "Today's Goal"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            Edit
          </Button>
        </div>

        <div className="mt-2">
          <p className="font-display text-2xl font-bold tabular-nums text-foreground">
            {eligibleMinutes} / {targetMinutes} min
          </p>
          <Progress value={progressPct} className={`mt-2 h-1.5 ${isCompleted ? "[&>div]:bg-emerald-500" : ""}`} />
          <p className="mt-2 text-xs font-medium truncate">
            {isCompleted ? (
              bonusMinutes > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  🎉 Completed! +{bonusMinutes}m bonus
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  🎉 Goal completed!
                </span>
              )
            ) : (
              <span className="text-muted-foreground">
                {targetMinutes - eligibleMinutes} {t("dashboard.toGo") || "min remaining"}
              </span>
            )}
          </p>
        </div>
      </Card>

      <DailyGoalModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        currentGoalMinutes={targetMinutes}
      />
    </>
  );
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
