import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { getAssessmentResult, type AssessmentResult } from "@/lib/api/assessment";
import { SkillResultCard } from "@/components/SkillResultCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Compass, RefreshCw, BarChart, ArrowRight, Zap, Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/hooks/use-language";

const searchSchema = z.object({ s: z.string().optional() });

export const Route = createFileRoute("/assessment-results")({
  head: () => ({ meta: [{ title: "Assessment Results — Aarambh AI" }] }),
  validateSearch: searchSchema,
  component: AssessmentResultsPage,
});

function AssessmentResultsPage() {
  const navigate = useNavigate();
  const { s } = Route.useSearch();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("assessmentResults.loading") || "Loading results..."}</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const outcomes = result.skillOutcomes ?? [];
  const strengths = result.strengths ?? [];
  const improvements = result.improvements ?? [];
  const path =
    result.recommendedLearningPath.length > 0
      ? result.recommendedLearningPath
      : [result.recommendedFocus];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        eyebrow={t("assessmentResults.headerEyebrow") || "Assessment Results"}
        title={t("assessmentResults.headerTitle") || "Evaluation Summary"}
        description={`${t("assessmentResults.headerDesc") || "Calculated on"} ${new Date(result.completedAt).toLocaleDateString()}`}
      />

      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stat summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 bg-primary/10 border-primary/20">
                <p className="text-sm font-bold text-primary mb-2">{t("assessmentResults.overallLevel") || "Overall Level"}</p>
                <div className="text-3xl font-bold text-primary-foreground">
                  {result.overallLevel}
                </div>
                <p className="text-sm text-primary mt-2">{t("assessmentResults.overallLevelSub") || "Across all language skills"}</p>
              </Card>

              <Card className="p-6">
                <p className="text-sm font-bold text-muted-foreground mb-2">{t("assessmentResults.recommendedFocus") || "Recommended Focus"}</p>
                <div className="text-2xl font-semibold">{result.recommendedFocus}</div>
                <p className="text-sm text-muted-foreground mt-2">{t("assessmentResults.recommendedFocusSub") || "Target for immediate training"}</p>
              </Card>

              <Card className="p-6">
                <p className="text-sm font-bold text-muted-foreground mb-2">{t("assessmentResults.questionsEvaluated") || "Questions Evaluated"}</p>
                <div className="text-3xl font-bold">{result.totalQuestions}</div>
                <p className="text-sm text-muted-foreground mt-2">{t("assessmentResults.questionsEvaluatedSub") || "Spanning LSRW methods"}</p>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
                <BarChart size={20} className="text-primary" />
                {t("assessmentResults.breakdownTitle") || "Competency Breakdown"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t("assessmentResults.breakdownDesc") || "Detailed outcomes for listening, speaking, reading, and writing skills."}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outcomes.map((o) => (
                  <SkillResultCard key={o.skill} outcome={o} />
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Zap size={18} className="text-primary" />
                  {t("assessmentResults.strengthsTitle") || "Demonstrated Strengths"}
                </h2>
                {strengths.length ? (
                  <div className="flex flex-wrap gap-2">
                    {strengths.map((s) => (
                      <Badge key={s} variant="secondary" className="gap-1">
                        ★ {s}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t("assessmentResults.noStrengths") || "No strengths marked yet. Consistent practice will build confidence."}
                  </p>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Target size={18} className="text-primary" />
                  {t("assessmentResults.growthTitle") || "Growth Opportunities"}
                </h2>
                {improvements.length ? (
                  <div className="flex flex-wrap gap-2">
                    {improvements.map((s) => (
                      <Badge key={s} variant="outline" className="gap-1">
                        ✎ {s}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {t("assessmentResults.noGrowth") || "Well-balanced proficiencies across all skills!"}
                  </p>
                )}
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
                <Compass size={20} className="text-primary" />
                {t("assessmentResults.pathTitle") || "Recommended Development Journey"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t("assessmentResults.pathDesc") || "Our adaptive engine suggests progressing through skill areas in this sequence:"}
              </p>
              <ol className="space-y-3">
                {path.map((p, i) => (
                  <li
                    key={p + i}
                    className="flex items-center gap-4 p-4 bg-muted rounded-lg border"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <span className="font-semibold">{p} {t("assessmentResults.modulePractice") || "Module Practice"}</span>
                    {i === 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {t("assessmentResults.recommendedStarting") || "Recommended Starting Point"}
                      </Badge>
                    )}
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          {/* Sidebar Actions Column */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                <Compass size={18} className="text-primary" />
                {t("assessmentResults.actionsTitle") || "Action Commands"}
              </h2>

              <Button
                onClick={() => navigate({ to: "/dashboard" })}
                className="w-full gap-2"
                size="lg"
              >
                {t("assessmentResults.enterDashboardBtn") || "Enter Dashboard"}
                <ArrowRight size={16} />
              </Button>

              <Button
                onClick={() => navigate({ to: "/assessment-intro" })}
                variant="outline"
                className="w-full gap-2 mt-3"
              >
                <RefreshCw size={16} />
                {t("assessmentResults.rerunBtn") || "Re-run Placement Test"}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
