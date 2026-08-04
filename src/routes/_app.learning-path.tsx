import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Gamepad2,
  Lock,
  MessageCircleHeart,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLearningJourney,
  type JourneyMilestone,
  type LearningJourney,
  type MilestoneState,
} from "@/lib/api/learning";

export const Route = createFileRoute("/_app/learning-path")({
  head: () => ({
    meta: [
      { title: "Your Learning Path — Aarambh AI" },
      {
        name: "description",
        content:
          "A visual, milestone-based roadmap of your personalised learning journey with XP, progress and AI recommendations.",
      },
      { property: "og:title", content: "Your Learning Path — Aarambh AI" },
      {
        property: "og:description",
        content: "Track milestones, XP and next steps on your personalised Aarambh AI learning journey.",
      },
    ],
  }),
  component: LearningPathPage,
});

const SKILL_LABEL_MAP: Record<string, string> = {
  listening: "Listening",
  speaking: "Speaking",
  reading: "Reading",
  writing: "Writing",
  vocabulary: "Vocabulary",
  grammar: "Grammar & Sentence",
  pronunciation: "Pronunciation",
  conversations: "Everyday Conversations",
};

const skillLabel = (skill?: string) =>
  (skill && (SKILL_LABEL_MAP[skill.toLowerCase()] || skill)) || "General";

const STATE_STYLES: Record<
  MilestoneState,
  { node: string; card: string; label: string; badge: string }
> = {
  completed: {
    node: "bg-primary text-primary-foreground",
    card: "border-primary/25 bg-primary/[0.04]",
    label: "Completed",
    badge: "bg-primary/10 text-primary border-primary/25",
  },
  current: {
    node: "bg-primary text-primary-foreground ring-4 ring-primary/20",
    card: "border-primary shadow-md bg-card",
    label: "In progress",
    badge: "bg-primary text-primary-foreground border-transparent",
  },
  available: {
    node: "bg-secondary text-secondary-foreground",
    card: "border-border bg-card",
    label: "Unlocked",
    badge: "bg-secondary text-secondary-foreground border-transparent",
  },
  locked: {
    node: "bg-muted text-muted-foreground",
    card: "border-dashed border-border bg-muted/30",
    label: "Locked",
    badge: "bg-muted text-muted-foreground border-transparent",
  },
};

function LearningPathPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["learning-journey"],
    queryFn: getLearningJourney,
    staleTime: 30_000,
  });

  if (isLoading) return <JourneySkeleton />;

  if (isError) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Card className="space-y-4 rounded-3xl p-8 text-center">
          <h2 className="text-xl font-semibold">We couldn't load your roadmap</h2>
          <p className="text-sm text-muted-foreground">
            {(error as Error)?.message || "Something went wrong while building your learning path."}
          </p>
          <Button onClick={() => refetch()} className="rounded-xl">
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  if (!data || !data.has_path || data.milestones.length === 0) return <EmptyPath />;

  return <JourneyView journey={data} />;
}

function JourneyView({ journey }: { journey: LearningJourney }) {
  const navigate = useNavigate();
  const current = useMemo(
    () => journey.milestones.find((m) => m.state === "current") ?? journey.milestones[0],
    [journey.milestones],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20 animate-in fade-in duration-300">
      <PageHeader
        eyebrow="Visual Roadmap"
        title="Your Learning Path"
        description={
          journey.learning_goal
            ? `A milestone-by-milestone journey built around your goal: ${journey.learning_goal}.`
            : "A milestone-by-milestone journey built from your assessment, lessons, practice and games."
        }
        actions={
          journey.next_lesson_id ? (
            <Button
              className="rounded-xl gap-2 font-semibold shadow-sm"
              onClick={() => navigate({ to: "/lesson/$lessonId", params: { lessonId: journey.next_lesson_id! } })}
            >
              <PlayCircle className="h-4 w-4" />
              Continue learning
            </Button>
          ) : null
        }
      />

      <JourneyOverview journey={journey} current={current} />

      {journey.recommendations.length > 0 && <Recommendations journey={journey} />}

      {journey.skill_profiles.length > 0 && <SkillMastery journey={journey} />}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Milestones</h2>
          <Badge variant="secondary" className="ml-1 text-xs font-semibold">
            {journey.modules_completed}/{journey.modules_total} done
          </Badge>
        </div>

        <div className="relative pl-9">
          <span className="absolute left-[15px] top-3 bottom-3 w-px bg-border" aria-hidden />
          <span
            className="absolute left-[15px] top-3 w-px bg-primary transition-all duration-700"
            style={{ height: `${Math.max(journey.overall_percentage, 2)}%` }}
            aria-hidden
          />
          <ol className="space-y-4">
            {journey.milestones.map((milestone) => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

function JourneyOverview({
  journey,
  current,
}: {
  journey: LearningJourney;
  current?: JourneyMilestone;
}) {
  const stats = [
    {
      icon: Trophy,
      label: "XP earned",
      value: `${journey.xp_earned}`,
      hint: `of ${journey.xp_available} available`,
    },
    {
      icon: BookOpen,
      label: "Lessons done",
      value: `${journey.completed_lessons}`,
      hint: `of ${journey.total_lessons} lessons`,
    },
    {
      icon: Clock,
      label: "Time remaining",
      value: `${journey.estimated_minutes_remaining} min`,
      hint: `${journey.daily_goal_minutes} min/day goal`,
    },
    {
      icon: CalendarClock,
      label: "Est. completion",
      value: `${journey.estimated_days_remaining} day${journey.estimated_days_remaining === 1 ? "" : "s"}`,
      hint: "at your current pace",
    },
  ];

  return (
    <Card className="overflow-hidden rounded-3xl border-primary/20">
      <div className="space-y-5 bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Overall progress
            </p>
            <p className="font-display text-3xl font-semibold tabular-nums">
              {journey.overall_percentage}%
            </p>
            {current && (
              <p className="text-sm text-muted-foreground">
                Currently on <span className="font-medium text-foreground">{current.title}</span>
              </p>
            )}
          </div>
          {current?.next_lesson_id && (
            <Button asChild variant="secondary" className="rounded-xl gap-2 font-semibold">
              <Link to="/lesson/$lessonId" params={{ lessonId: current.next_lesson_id }}>
                Resume {current.title}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        <Progress value={journey.overall_percentage} className="h-2.5" />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value, hint }) => (
            <div key={label} className="rounded-2xl border border-border/60 bg-card/80 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
              </div>
              <p className="mt-1.5 font-display text-xl font-semibold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Recommendations({ journey }: { journey: LearningJourney }) {
  const actionLink = (action: string, target: string) => {
    if (action === "lesson" && target) return { to: "/lesson/$lessonId" as const, params: { lessonId: target } };
    if (action === "practice") return { to: "/practice" as const };
    if (action === "games") return { to: "/games" as const };
    return { to: "/ai-tutor" as const };
  };
  const actionLabel: Record<string, string> = {
    lesson: "Open lesson",
    practice: "Practice now",
    games: "Play a game",
    tutor: "Ask the tutor",
  };
  const actionIcon: Record<string, typeof Zap> = {
    lesson: PlayCircle,
    practice: Target,
    games: Gamepad2,
    tutor: MessageCircleHeart,
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-semibold">Recommended for you</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {journey.recommendations.map((rec, i) => {
          const Icon = actionIcon[rec.action] ?? Sparkles;
          return (
            <Card
              key={`${rec.type}-${i}`}
              className="group flex flex-col gap-3 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <h3 className="font-semibold leading-snug">{rec.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{rec.message}</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="mt-auto w-fit gap-1 rounded-lg px-2 font-semibold text-primary">
                <Link {...(actionLink(rec.action, rec.target) as any)}>
                  {actionLabel[rec.action] ?? "Open"}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function SkillMastery({ journey }: { journey: LearningJourney }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-semibold">Skill mastery</h2>
      </div>
      <Card className="rounded-2xl p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {journey.skill_profiles.map((p) => (
            <div key={p.skill} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{skillLabel(p.skill)}</span>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {Math.round(p.mastery_percentage)}%
                </span>
              </div>
              <Progress value={p.mastery_percentage} className="h-1.5" />
              <p className="text-xs text-muted-foreground">Level {p.current_level}</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

function MilestoneCard({ milestone }: { milestone: JourneyMilestone }) {
  const [open, setOpen] = useState(milestone.state === "current");
  const style = STATE_STYLES[milestone.state];
  const locked = milestone.state === "locked";

  return (
    <li className="relative">
      <span
        className={cn(
          "absolute -left-9 top-6 grid h-[30px] w-[30px] place-items-center rounded-full text-xs font-bold ring-4 ring-background",
          style.node,
        )}
      >
        {milestone.state === "completed" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : locked ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          milestone.order
        )}
      </span>

      <Card className={cn("rounded-2xl transition-all", style.card, !locked && "hover:shadow-md")}>
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("text-[11px] font-semibold", style.badge)}>{style.label}</Badge>
            <Badge variant="outline" className="text-[11px] font-medium">
              {skillLabel(milestone.skill)}
            </Badge>
            <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              {milestone.xp_earned}/{milestone.xp_total} XP
            </span>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-display text-lg font-semibold leading-snug">{milestone.title}</h3>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {milestone.description}
            </p>
          </div>

          {milestone.recommendation_reason && !locked && (
            <p className="flex items-start gap-2 rounded-xl bg-primary/[0.06] px-3 py-2 text-xs leading-relaxed text-foreground/80">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {milestone.recommendation_reason}
            </p>
          )}

          {locked && milestone.unmet_prerequisites.length > 0 && (
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Unlocks after you finish the earlier milestone{milestone.unmet_prerequisites.length > 1 ? "s" : ""}.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {milestone.completed_lessons}/{milestone.total_lessons} lessons
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {milestone.estimated_duration} mins
            </span>
            <span className="flex items-center gap-1">
              <Award className="h-3.5 w-3.5" />
              Level {milestone.difficulty}
            </span>
          </div>

          {milestone.total_lessons > 0 && (
            <Progress value={milestone.progress_percentage} className="h-1.5" />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!locked && milestone.next_lesson_id && (
              <Button asChild size="sm" className="rounded-xl gap-1.5 font-semibold">
                <Link to="/lesson/$lessonId" params={{ lessonId: milestone.next_lesson_id }}>
                  <PlayCircle className="h-4 w-4" />
                  {milestone.completed_lessons > 0 ? "Continue" : "Start"}
                </Link>
              </Button>
            )}
            {!locked && !milestone.next_lesson_id && milestone.state === "completed" && (
              <Button asChild size="sm" variant="secondary" className="rounded-xl gap-1.5 font-semibold">
                <Link to="/practice">
                  <Target className="h-4 w-4" />
                  Revise with practice
                </Link>
              </Button>
            )}
            {!locked && (
              <>
                <Button asChild size="sm" variant="ghost" className="rounded-xl gap-1.5">
                  <Link to="/games">
                    <Gamepad2 className="h-4 w-4" /> Games
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost" className="rounded-xl gap-1.5">
                  <Link to="/resources">
                    <BookOpen className="h-4 w-4" /> Resources
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost" className="rounded-xl gap-1.5">
                  <Link to="/ai-tutor">
                    <MessageCircleHeart className="h-4 w-4" /> Ask tutor
                  </Link>
                </Button>
              </>
            )}
            {milestone.lessons.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto rounded-xl gap-1 text-muted-foreground"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
              >
                {open ? "Hide" : "Show"} lessons
                <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
              </Button>
            )}
          </div>

          {open && milestone.lessons.length > 0 && (
            <ul className="space-y-1.5 border-t border-border/60 pt-4">
              {milestone.lessons.map((lesson) => {
                const done = lesson.status === "completed";
                const inProgress = lesson.status === "in_progress";
                const content = (
                  <>
                    <span
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                        done
                          ? "bg-primary/15 text-primary"
                          : inProgress
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : lesson.order}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{lesson.title}</span>
                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {lesson.lesson_type}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                      +{lesson.xp_reward} XP
                    </span>
                  </>
                );
                return (
                  <li key={lesson.id}>
                    {locked ? (
                      <div className="flex items-center gap-3 rounded-xl px-3 py-2 opacity-60">{content}</div>
                    ) : (
                      <Link
                        to="/lesson/$lessonId"
                        params={{ lessonId: lesson.id }}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-muted/60"
                      >
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>
    </li>
  );
}

function EmptyPath() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-12 text-center">
      <Card className="space-y-6 rounded-3xl border-primary/20 p-8 shadow-md">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold">Your roadmap is waiting</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
            Take the short placement check-in. We'll calibrate your starting level and build a
            step-by-step path with milestones, XP and AI guidance.
          </p>
        </div>
        <Button asChild size="lg" className="h-12 gap-2 rounded-2xl font-bold shadow-md">
          <Link to="/assessment-quiz">
            Start diagnostic assessment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </Card>
    </div>
  );
}

function JourneySkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <div className="space-y-3 border-b border-border/60 pb-6">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-56 w-full rounded-3xl" />
      <div className="grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
