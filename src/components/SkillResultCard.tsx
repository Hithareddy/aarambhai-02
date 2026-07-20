import { SKILL_ICON, SKILL_LABEL, type SkillOutcome } from "@/lib/api/assessment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  outcome: SkillOutcome;
}

export function SkillResultCard({ outcome }: Props) {
  const scoreLabel =
    outcome.score == null ? "Response recorded" : `${Math.round(outcome.score * 100)}% accuracy`;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            {SKILL_ICON[outcome.skill]}
          </span>
          <div>
            <div className="text-sm text-muted-foreground">{SKILL_LABEL[outcome.skill]}</div>
            <div className="font-semibold text-lg">{outcome.level}</div>
          </div>
        </div>
        <Badge variant="secondary">{scoreLabel}</Badge>
      </div>
      <div className="text-sm text-muted-foreground">
        {outcome.asked} question{outcome.asked === 1 ? "" : "s"}
      </div>
    </Card>
  );
}
