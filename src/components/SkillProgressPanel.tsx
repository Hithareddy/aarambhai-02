import { SKILLS, SKILL_ICON, SKILL_LABEL, type Skill } from "@/lib/api/assessment";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Props {
  counts: Record<Skill, { asked: number; total: number }>;
  currentSkill: Skill;
}

export function SkillProgressPanel({ counts, currentSkill }: Props) {
  return (
    <div className="space-y-3" aria-label="Skill progress">
      {SKILLS.map((skill) => {
        const { asked, total } = counts[skill];
        const percent = total ? Math.round((asked / total) * 100) : 0;
        const status = asked === 0 ? "Not started" : asked >= total ? "Done" : "In progress";
        const isCurrent = currentSkill === skill;
        
        return (
          <div
            key={skill}
            className={`p-3 rounded-lg border transition-colors ${
              isCurrent ? "bg-primary/10 border-primary" : "bg-muted/30 border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>
                  {SKILL_ICON[skill]}
                </span>
                <span className="font-medium text-sm">{SKILL_LABEL[skill]}</span>
              </div>
              <Badge variant={isCurrent ? "default" : "secondary"} className="text-xs">
                {asked}/{total}
              </Badge>
            </div>
            <Progress value={percent} className="h-1.5 mb-2" />
            <div className="text-xs text-muted-foreground">{status}</div>
          </div>
        );
      })}
    </div>
  );
}
