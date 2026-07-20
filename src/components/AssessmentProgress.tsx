import { SKILL_ICON, SKILL_LABEL, type Skill } from "@/lib/api/assessment";
import { Progress } from "@/components/ui/progress";

interface Props {
  currentIndex: number; // 0-based
  total: number;
  currentSkill: Skill;
}

export function AssessmentProgress({ currentIndex, total, currentSkill }: Props) {
  const answered = currentIndex; // questions completed before this one
  const percent = total ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="space-y-3" aria-live="polite">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {SKILL_ICON[currentSkill]}
          </span>
          <div>
            <div className="text-xs text-muted-foreground">Current skill</div>
            <div className="font-semibold">{SKILL_LABEL[currentSkill]}</div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Question {Math.min(currentIndex + 1, total)} of {total}
        </div>
      </div>
      <Progress value={percent} className="h-2" />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Overall progress</span>
        <span>{percent}%</span>
      </div>
    </div>
  );
}
