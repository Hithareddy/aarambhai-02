import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, BookOpen, Star, Users, Lock } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_app/achievements")({
  head: () => ({ meta: [{ title: "Achievements — Aarambh AI" }] }),
  component: AchievementsPage,
});

const earned = [
  { icon: Flame, title: "First streak", desc: "Learned 3 days in a row." },
  { icon: BookOpen, title: "First lesson", desc: "Completed your very first lesson." },
  { icon: Star, title: "Curious mind", desc: "Explored 5 different topics." },
];

const locked = [
  { icon: Trophy, title: "Steady learner", desc: "Reach a 14-day streak." },
  { icon: Users, title: "Community spark", desc: "Post your first question." },
];

function AchievementsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Achievements"
        title="Little wins, kept close"
        description="Collect gentle milestones as you learn."
      />

      <section>
        <h2 className="font-display text-lg font-semibold">Earned</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {earned.map((b) => (
            <Card key={b.title} className="p-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
                <b.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-display text-base font-semibold">{b.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Locked</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locked.map((b) => (
            <Card key={b.title} className="p-5 opacity-70">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <b.icon className="h-6 w-6" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <h3 className="font-display text-base font-semibold">{b.title}</h3>
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" /> Locked
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Leaderboard</h2>
        <EmptyState
          className="mt-4"
          icon={<Trophy className="h-5 w-5" />}
          title="Leaderboards coming soon"
          description="Opt-in gentle leaderboards will let you cheer on other learners."
        />
      </section>
    </div>
  );
}
