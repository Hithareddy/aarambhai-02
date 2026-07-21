import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export const Route = createFileRoute("/_app/learning-path")({
  head: () => ({ meta: [{ title: "Learning Path — Aarambh AI" }] }),
  component: LearningPathPage,
});

const chapters = [
  { title: "Getting comfortable", lessons: 4, state: "done" as const },
  { title: "Everyday greetings", lessons: 5, state: "done" as const },
  { title: "Numbers & counting", lessons: 6, state: "current" as const, current: 2 },
  { title: "Asking questions", lessons: 5, state: "locked" as const },
  { title: "Small talk basics", lessons: 6, state: "locked" as const },
  { title: "Shopping & money", lessons: 5, state: "locked" as const },
];

function LearningPathPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("learningPath.eyebrow") || "Your journey"}
        title={t("learningPath.title") || "Everyday English — beginner path"}
        description={t("learningPath.description") || "A gentle path built for you. Complete one step at a time, at your own pace."}
        actions={<Button variant="outline">{t("learningPath.changePath") || "Change path"}</Button>}
      />

      <div className="relative pl-6">
        <span className="absolute left-2 top-2 bottom-2 w-px bg-border" />
        <div className="space-y-4">
          {chapters.map((c, i) => (
            <div key={c.title} className="relative">
              <span
                className={`absolute -left-6 top-4 grid h-4 w-4 place-items-center rounded-full ring-4 ring-background ${c.state === "done"
                    ? "bg-success"
                    : c.state === "current"
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
              />
              <Card
                className={`p-5 ${c.state === "current" ? "border-primary/40 shadow-sm" : ""
                  }`}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {t("learningPath.chapterNum", { num: String(i + 1).padStart(2, "0") }) || `Chapter ${String(i + 1).padStart(2, "0")}`}
                      </span>
                      {c.state === "done" && (
                        <Badge className="bg-success/15 text-success hover:bg-success/15">
                          {t("learningPath.completed") || "Completed"}
                        </Badge>
                      )}
                      {c.state === "current" && (
                        <Badge className="bg-primary-soft text-primary hover:bg-primary-soft">
                          {t("learningPath.inProgress") || "In progress"}
                        </Badge>
                      )}
                      {c.state === "locked" && (
                        <Badge variant="secondary">{t("learningPath.locked") || "Locked"}</Badge>
                      )}
                    </div>
                    <h3 className="mt-1 font-display text-lg font-semibold">{t(`learningPath.chapters.${i}.title`) || c.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.state === "current"
                        ? t("learningPath.currentStatus", { current: String(c.current), total: String(c.lessons) }) || `${c.current} of ${c.lessons} lessons done`
                        : t("learningPath.totalLessons", { total: String(c.lessons) }) || `${c.lessons} lessons`}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {c.state === "done" ? (
                      <Button variant="ghost" size="sm" className="gap-1">
                        <CheckCircle2 className="h-4 w-4 text-success" /> {t("learningPath.btnReview") || "Review"}
                      </Button>
                    ) : c.state === "current" ? (
                      <Button size="sm" className="gap-1">
                        <PlayCircle className="h-4 w-4" /> {t("learningPath.btnContinue") || "Continue"}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled className="gap-1">
                        <Lock className="h-4 w-4" /> {t("learningPath.btnLocked") || "Locked"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
