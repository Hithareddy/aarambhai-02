import { Flame, Trophy, Sparkles, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStreakStats } from "@/lib/api/hooks";
import { useLanguage } from "@/hooks/use-language";

interface StreakCardProps {
  initialStreakDays?: number;
  initialLongestStreak?: number;
}

export function StreakCard({ initialStreakDays = 0, initialLongestStreak = 0 }: StreakCardProps) {
  const { t } = useLanguage();
  const { data: streakData, isLoading } = useStreakStats();

  const currentStreak = streakData?.current_streak ?? initialStreakDays;
  const longestStreak = streakData?.longest_streak ?? Math.max(initialLongestStreak, currentStreak);
  const todayCompleted = streakData?.today_completed ?? false;
  const isNewLearner = streakData?.is_new_learner ?? (currentStreak === 0 && longestStreak === 0);

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-2xl" />;
  }

  return (
    <Card className="p-4 border border-border transition-all bg-gradient-to-br from-amber-500/5 via-card to-orange-500/5 dark:from-amber-950/20 dark:to-orange-950/20">
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400">
            <Flame className="h-4 w-4 fill-orange-500/30" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-sm font-semibold text-foreground truncate">
              {t("streak.title") || "Learning Streak"}
            </h3>
          </div>
        </div>

        <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-semibold shrink-0">
          <Trophy className="h-3 w-3 text-amber-500" />
          <span>{t("streak.longest", { days: String(longestStreak) })}</span>
        </Badge>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-black tracking-tight text-foreground flex items-center gap-1.5">
            <Flame className="h-6 w-6 text-orange-500 animate-pulse fill-orange-500" />
            {isNewLearner && currentStreak === 0
              ? t("streak.startToday")
              : t("streak.currentStreak", { count: String(currentStreak) })}
          </span>
        </div>

        <p className="mt-1.5 text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          {isNewLearner && currentStreak === 0 ? (
            <span className="text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              {t("streak.startDesc")}
            </span>
          ) : todayCompleted ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              {t("streak.goalCompletedKeepGoing")}
            </span>
          ) : (
            <span className="text-amber-700 dark:text-amber-300 font-medium">
              {t("streak.completeGoalToMake", { next: String(currentStreak + 1) })}
            </span>
          )}
        </p>
      </div>
    </Card>
  );
}
