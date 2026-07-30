import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock, PlayCircle, Award, Sparkles, Compass, Clock, ArrowRight, BookOpen } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { getAssessmentHistory } from "@/lib/api/assessment";
import { getModules, getModule, type LearningModule } from "@/lib/api/learning";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/learning-path")({
  head: () => ({ meta: [{ title: "Learning Path Roadmap — Aarambh AI" }] }),
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

export function LearningPathPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [hasPath, setHasPath] = useState(false);
  const [learningPath, setLearningPath] = useState<any[]>([]);
  const [modulesMap, setModulesMap] = useState<Record<string, LearningModule>>({});

  useEffect(() => {
    const loadRoadmap = async () => {
      setLoading(true);
      try {
        const [history, allModules] = await Promise.all([
          getAssessmentHistory(),
          getModules(),
        ]);

        // Map modules by ID for fast details access
        const modMap: Record<string, LearningModule> = {};
        allModules.forEach((m) => {
          modMap[m.id] = m;
        });
        setModulesMap(modMap);

        const latest = history[0]; // history is sorted desc by default
        if (latest && latest.recommendedLearningPath && latest.recommendedLearningPath.length > 0) {
          setHasPath(true);
          // Sort by priority ascending
          const sortedPath = [...latest.recommendedLearningPath].sort((a, b) => a.priority - b.priority);
          setLearningPath(sortedPath);
        } else {
          setHasPath(false);
        }
      } catch (err) {
        console.error("Failed to load learning path roadmap:", err);
        toast.error("Failed to load your learning roadmap.");
      } finally {
        setLoading(false);
      }
    };

    loadRoadmap();
  }, []);

  const handleStartModule = async (moduleId: string) => {
    setActionLoading(moduleId);
    try {
      const data = await getModule(moduleId);
      if (data.lessons && data.lessons.length > 0) {
        const sorted = [...data.lessons].sort((a, b) => a.order - b.order);
        navigate({ to: `/lesson/${sorted[0].id}` as any });
      } else {
        toast.error("No lessons found for this module.");
      }
    } catch (err) {
      console.error("Failed to load lessons for module:", err);
      toast.error("Failed to start module. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground animate-pulse text-sm font-medium">Assembling your custom visual roadmap...</p>
        </div>
      </div>
    );
  }

  if (!hasPath) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 text-center space-y-8">
        <Card className="p-8 rounded-3xl border-primary/20 shadow-md space-y-6 bg-card">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary text-3xl font-bold">
            🗺️
          </div>
          <div className="space-y-2">
            <h2 className="font-extrabold text-2xl text-foreground">Placement Roadmap Locked</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              Please complete the diagnostic initial placement check-in. Our engine will calibrate your starting proficiency level and tailor a step-by-step sequence.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-2xl font-bold h-12 gap-2 shadow-md hover:shadow-lg transition">
            <Link to="/assessment-quiz">
              <span>Start Diagnostic Assessment</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <PageHeader
        eyebrow="Visual Roadmap"
        title="Everyday Communication Skill Path"
        description="Your step-by-step learning journey, customized from your diagnostic performance. Click any module card to start learning immediately."
      />

      <div className="relative pl-6">
        <span className="absolute left-2 top-2 bottom-2 w-0.5 bg-primary/20 animate-pulse" />
        <div className="space-y-6">
          {learningPath.map((item, i) => {
            const moduleDetail = modulesMap[item.module_id];
            const title = moduleDetail?.title || item.title;
            const desc = moduleDetail?.description || "Master core concepts in this targeted segment.";
            const duration = moduleDetail?.estimated_duration || 10;
            const skill = moduleDetail?.skill || item.skill;

            return (
              <div key={item.module_id} className="relative group">
                <span
                  className={`absolute -left-6 top-5 grid h-5 w-5 place-items-center rounded-full ring-4 ring-background bg-primary text-white text-[10px] font-extrabold`}
                >
                  {i + 1}
                </span>
                
                <Card
                  onClick={() => handleStartModule(item.module_id)}
                  className={`p-6 rounded-3xl border-2 transition-all shadow-sm hover:shadow-md hover:border-primary/40 cursor-pointer bg-card ${
                    i === 0 ? "border-primary bg-primary/5 shadow-md" : "border-border"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-muted-foreground uppercase">
                          Step {String(i + 1).padStart(2, "0")}
                        </span>
                        {i === 0 && (
                          <Badge className="bg-primary/10 text-primary border-primary/30 text-xs font-bold">
                            Up Next
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {SKILL_LABEL_MAP[skill.toLowerCase()] || skill}
                        </Badge>
                      </div>
                      
                      <h3 className="font-extrabold text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                        {title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">{desc}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> 1 lesson
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {duration} mins
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 w-full sm:w-auto">
                      <Button
                        size="sm"
                        disabled={actionLoading === item.module_id}
                        className={`w-full sm:w-auto rounded-xl font-bold gap-1 shadow-sm ${
                          i === 0 ? "" : "variant-secondary"
                        }`}
                      >
                        {actionLoading === item.module_id ? (
                          "Loading..."
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4" /> Start
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
