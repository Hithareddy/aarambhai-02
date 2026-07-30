import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { getAssessmentResult, type AssessmentResult, type Skill } from "@/lib/api/assessment";
import { getModule } from "@/lib/api/learning";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Compass, RefreshCw, BarChart, ArrowRight, Zap, Target, Gamepad2, Sparkles, Clock, CheckCircle2, Trophy, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/hooks/use-language";
import { toast } from "sonner";

const searchSchema = z.object({ s: z.string().optional() });

export const Route = createFileRoute("/assessment-results")({
  head: () => ({ meta: [{ title: "Diagnostic Results & Personal Learning Plan — Aarambh AI" }] }),
  validateSearch: searchSchema,
  component: AssessmentResultsPage,
});

function renderBlockMeter(score: number | null): string {
  if (score === null) return "░░░░░░░░░░";
  const filledCount = Math.max(0, Math.min(10, Math.round(score * 10)));
  const emptyCount = 10 - filledCount;
  return "█".repeat(filledCount) + "░".repeat(emptyCount);
}

const SKILL_LABEL_MAP: Record<string, string> = {
  listening: "Listening",
  speaking: "Speaking",
  reading: "Reading",
  writing: "Writing",
  vocabulary: "Vocabulary",
  grammar: "Grammar / Sentences",
  pronunciation: "Pronunciation",
  conversations: "Conversations",
};

export function AssessmentResultsPage() {
  const navigate = useNavigate();
  const { s } = Route.useSearch();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const loadResult = async () => {
      const sessionId = s || localStorage.getItem("assessment_session_id");
      if (!sessionId) {
        navigate({ to: "/assessment-intro" });
        return;
      }

      try {
        const r = await getAssessmentResult(sessionId);
        setResult(r);
      } catch (err) {
        console.error("Failed to load results:", err);
        navigate({ to: "/assessment-intro" });
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [s, navigate]);

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
      console.error("Failed to load module lessons:", err);
      toast.error("Failed to start module. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetake = () => {
    localStorage.removeItem("assessment_session_id");
    navigate({ to: "/assessment-intro" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-lg font-medium text-muted-foreground animate-pulse">{t("assessmentResults.loading") || "Assembling your personalized learning path..."}</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const outcomes = result.skillOutcomes ?? [];
  const strengths = result.strengths ?? [];
  const improvements = result.improvements ?? [];
  const path = result.recommendedLearningPath || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-background to-background dark:from-blue-950/20">
      <PageHeader
        eyebrow={t("assessmentResults.headerEyebrow") || "Diagnostic Placement Milestone"}
        title={t("assessmentResults.headerTitle") || "Your Personal Learning Profile"}
        description={`${t("assessmentResults.headerDesc") || "Completed on"} ${new Date(result.completedAt).toLocaleDateString()}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* Celebration Header Card */}
        <Card className="p-8 mb-8 rounded-3xl border-primary/20 bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 shadow-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Diagnostic Assessment Complete!</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Great job! You earned <span className="text-primary">+150 XP</span>
              </h1>
              <p className="text-base text-muted-foreground max-w-xl">
                We've benchmarked your starting level and tailored a personalized path to help you build confidence in everyday communication.
              </p>
            </div>

            {/* Badges & XP Pill */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-amber-600 dark:text-amber-400 font-bold shadow-sm">
                <Trophy className="h-6 w-6" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-amber-600/80">Badge Earned</div>
                  <div className="text-sm font-extrabold">First Step Explorer</div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-primary/10 border border-primary/30 px-4 py-3 text-primary font-bold shadow-sm">
                <Zap className="h-6 w-6 text-primary fill-primary" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-primary/80">XP Earned</div>
                  <div className="text-sm font-extrabold">+150 XP</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stat summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-6 rounded-2xl bg-primary/10 border-primary/20 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-wider text-primary mb-1">{t("assessmentResults.overallLevel") || "Language Band"}</p>
                <div className="text-3xl font-extrabold text-primary">
                  {result.overallLevel.toUpperCase()}
                </div>
                <p className="text-xs text-primary/80 mt-2 font-medium">{t("assessmentResults.overallLevelSub") || "Everyday Communication Baseline"}</p>
              </Card>

              <Card className="p-6 rounded-2xl border-border/80 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-1">{t("assessmentResults.recommendedFocus") || "Primary Focus"}</p>
                <div className="text-2xl font-bold capitalize text-foreground">{SKILL_LABEL_MAP[result.recommendedFocus.toLowerCase()] || result.recommendedFocus}</div>
                <p className="text-xs text-muted-foreground mt-2">{t("assessmentResults.recommendedFocusSub") || "Prioritized for immediate gains"}</p>
              </Card>

              <Card className="p-6 rounded-2xl border-border/80 shadow-sm">
                <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-1">{t("assessmentResults.dailyPractice") || "Daily Practice Goal"}</p>
                <div className="text-2xl font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>15 Mins / Day</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t("assessmentResults.dailyPracticeSub") || "Recommended daily routine"}</p>
              </Card>
            </div>

            {/* AI Summary Banner */}
            {result.learningSummary && (
              <Card className="p-6 rounded-2xl bg-card border-border/80 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-bold mb-2 text-foreground">
                  <Award size={20} className="text-primary" />
                  {t("assessmentResults.summaryTitle") || "Personalized AI Diagnostic Insight"}
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {result.learningSummary}
                </p>
              </Card>
            )}

            {/* Skill Breakdown with block progress bars */}
            <Card className="p-6 rounded-2xl border-border/80 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-bold mb-2">
                <BarChart size={22} className="text-primary" />
                {t("assessmentResults.breakdownTitle") || "Competency & Skill Breakdown"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t("assessmentResults.breakdownDesc") || "Outcomes across listening, speaking, reading, and writing modules."}
              </p>
              <div className="space-y-4 max-w-xl">
                {outcomes.length > 0 ? (
                  outcomes.map((o) => {
                    const label = SKILL_LABEL_MAP[o.skill.toLowerCase()] || o.skill;
                    return (
                      <div key={o.skill} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="font-semibold text-sm w-32 shrink-0">{label}</span>
                        <span className="font-mono text-primary text-sm tracking-wider flex-1 text-left pr-4">
                          {renderBlockMeter(o.score)}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground w-20 text-right">
                          {o.score !== null ? `${Math.round(o.score * 100)}%` : "N/A"}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground italic">No skills were assessed in this session.</p>
                )}
              </div>
            </Card>

            {/* Strengths & Growth Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 rounded-2xl border-border/80 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-emerald-600 dark:text-emerald-400">
                  <Zap size={20} />
                  {t("assessmentResults.strengthsTitle") || "Demonstrated Strengths"}
                </h2>
                {strengths.length ? (
                  <div className="flex flex-wrap gap-2">
                    {strengths.map((s) => (
                      <Badge key={s} className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 px-3 py-1 text-sm font-semibold gap-1">
                        ★ {SKILL_LABEL_MAP[s.toLowerCase()] || s}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t("assessmentResults.noStrengths") || "Consistent practice will unlock strengths!"}
                  </p>
                )}
              </Card>

              <Card className="p-6 rounded-2xl border-border/80 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-amber-600 dark:text-amber-400">
                  <Target size={20} />
                  {t("assessmentResults.growthTitle") || "Focus Growth Areas"}
                </h2>
                {improvements.length ? (
                  <div className="flex flex-wrap gap-2">
                    {improvements.map((s) => (
                      <Badge key={s} variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 px-3 py-1 text-sm font-semibold gap-1">
                        ✎ {SKILL_LABEL_MAP[s.toLowerCase()] || s}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t("assessmentResults.noGrowth") || "Well-balanced proficiencies across skills!"}
                  </p>
                )}
              </Card>
            </div>

            {/* Recommended Learning Path */}
            <Card className="p-6 rounded-2xl border-border/80 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-bold mb-2">
                <Compass size={22} className="text-primary" />
                {t("assessmentResults.pathTitle") || "Your Personalized Learning Sequence"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t("assessmentResults.pathDesc") || "Our adaptive engine recommends completing modules in this sequence:"}
              </p>
              <ol className="relative border-l-2 border-primary/30 ml-4 space-y-6">
                {path.length > 0 ? (
                  path.map((p, i) => (
                    <li key={p.module_id} className="ml-6">
                      <span className="absolute -left-[13px] flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-extrabold shadow">
                        {p.priority}
                      </span>
                      <div
                        onClick={() => handleStartModule(p.module_id)}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-card rounded-2xl border border-border/60 shadow-sm hover:border-primary/40 hover:shadow-md cursor-pointer transition"
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="font-bold text-base text-foreground truncate">{p.title}</span>
                          <span className="text-xs text-muted-foreground capitalize">Focus Skill: {SKILL_LABEL_MAP[p.skill.toLowerCase()] || p.skill}</span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {i === 0 && (
                            <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                              {t("assessmentResults.recommendedStarting") || "Starting Module"}
                            </Badge>
                          )}
                          <Button size="sm" disabled={actionLoading === p.module_id} className="ml-auto sm:ml-0 font-bold text-xs gap-1 rounded-xl">
                            {actionLoading === p.module_id ? "Loading..." : "Start"} <ArrowUpRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="ml-6 text-muted-foreground italic text-sm">Return to dashboard to access modules.</li>
                )}
              </ol>
            </Card>

            {/* Recommended Learning Games Section */}
            <Card className="p-6 rounded-2xl border-border/80 shadow-sm bg-gradient-to-br from-indigo-500/5 via-card to-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Gamepad2 size={22} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Personalized Learning Games</span>
                </h2>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Weakness Targeted
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Practice and strengthen your diagnosed focus areas through interactive educational games.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-border/60 bg-card hover:border-indigo-500/40 transition flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-2xl mb-2">🎴</div>
                    <h3 className="font-bold text-base">Flashcard Deck</h3>
                    <p className="text-xs text-muted-foreground mt-1">Master vocabulary and picture-word associations.</p>
                  </div>
                  <Button size="sm" variant="secondary" className="w-full font-bold rounded-xl" onClick={() => navigate({ to: "/games" })}>
                    Play Flashcards
                  </Button>
                </div>

                <div className="p-5 rounded-2xl border border-border/60 bg-card hover:border-indigo-500/40 transition flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-2xl mb-2">🧩</div>
                    <h3 className="font-bold text-base">Sentence Builder</h3>
                    <p className="text-xs text-muted-foreground mt-1">Drag and drop word tokens to construct grammar sentences.</p>
                  </div>
                  <Button size="sm" variant="secondary" className="w-full font-bold rounded-xl" onClick={() => navigate({ to: "/games" })}>
                    Play Sentence Builder
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sticky Action Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 rounded-3xl border-primary/30 shadow-md sticky top-6 bg-card">
              <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
                <Compass size={20} className="text-primary" />
                <span>Next Actions</span>
              </h2>

              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Your diagnostic results have been saved. Ready to explore your personalized learning path?
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate({ to: "/learning-path" })}
                  className="w-full h-14 rounded-2xl font-bold text-base gap-2 shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <span>View My Learning Path</span>
                  <ArrowRight size={18} />
                </Button>

                <Button
                  onClick={() => navigate({ to: "/dashboard" })}
                  variant="outline"
                  className="w-full h-12 rounded-2xl gap-2 font-semibold text-sm border-border/80"
                >
                  <span>Go to Dashboard</span>
                </Button>

                <Button
                  onClick={handleRetake}
                  variant="ghost"
                  className="w-full h-12 rounded-2xl gap-2 font-semibold text-sm hover:text-destructive"
                >
                  <RefreshCw size={14} />
                  <span>Retake Assessment</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

