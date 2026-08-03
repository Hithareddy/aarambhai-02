import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Printer,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/use-language";
import { getAssessmentHistory, SKILL_LABEL, SKILL_ICON, type AssessmentResult, type Skill } from "@/lib/api/assessment";
import { getLearnerProfile, type LearnerProfile } from "@/lib/api/learner";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Professional Assessment Report — Aarambh AI" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { websiteLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<AssessmentResult | null>(null);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);

  useEffect(() => {
    async function loadReportData() {
      try {
        setLoading(true);
        const [history, learnerProf] = await Promise.all([
          getAssessmentHistory().catch(() => []),
          getLearnerProfile().catch(() => null),
        ]);
        if (history && history.length > 0) {
          setReport(history[0]);
        }
        setProfile(learnerProf);
      } catch (err) {
        toast.error("Could not load report data.");
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6 p-4">
        <PageHeader
          eyebrow="Diagnostic Assessment Report"
          title="Professional Assessment & Learning Report"
          description="Detailed breakdown of your language diagnostic results, skill proficiencies, and AI learning path."
        />
        <Card className="p-8 text-center space-y-4 max-w-lg mx-auto border-dashed">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold font-display">No Diagnostic Check-in Found</h2>
          <p className="text-sm text-muted-foreground">
            Complete your initial adaptive placement check-in to generate your official diagnostic report.
          </p>
          <Link to="/assessments">
            <Button className="gap-2 mt-2">
              <Sparkles className="h-4 w-4" /> Start Initial Check-in
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const overallScorePercent = Math.round(report.confidenceScore * 100);
  const formattedDate = report.completedAt
    ? new Date(report.completedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recent Diagnostic";

  return (
    <div className="space-y-6 print:p-0 print:m-0">
      {/* Header */}
      <PageHeader
        eyebrow="Diagnostic Assessment Report"
        title="Professional Language Proficiency Report"
        description="Comprehensive analysis of placement results, skill proficiencies, and personalized learning path."
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" /> Print / Save PDF
            </Button>
            <Link to="/learn">
              <Button className="gap-2">
                <BookOpen className="h-4 w-4" /> Continue Learning
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary Profile Banner */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-background/80 font-mono text-xs">
                OFFICIAL DIAGNOSTIC REPORT
              </Badge>
              <Badge className="bg-primary text-primary-foreground font-semibold">
                CEFR: {report.overallLevel}
              </Badge>
              <span className="text-xs text-muted-foreground">• Completed on {formattedDate}</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-foreground">
              {profile?.name || "Learner Diagnostic Summary"}
            </h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Goal: {profile?.learning_goal || "General Proficiency"}</span>
              <span>•</span>
              <span>Target: {profile?.learning_language || "English"}</span>
            </div>
          </div>


          <div className="flex items-center gap-6 bg-background/60 p-4 rounded-xl border border-border/50">
            <div className="text-center">
              <p className="text-2xl font-black text-primary font-display">{overallScorePercent}%</p>
              <p className="text-xs font-medium text-muted-foreground">Confidence</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-2xl font-black text-accent font-display">{report.skillOutcomes.length}</p>
              <p className="text-xs font-medium text-muted-foreground">Skills Evaluated</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Skill Scores & AI Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Skill Proficiencies */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-bold">Skill Diagnostic Breakdown</h3>
            </div>
            <Badge variant="secondary">{report.skillOutcomes.length} Evaluated</Badge>
          </div>

          <div className="space-y-4 mt-2">
            {report.skillOutcomes.map((outcome) => {
              const label = SKILL_LABEL[outcome.skill as Skill] || outcome.skill;
              const icon = SKILL_ICON[outcome.skill as Skill] || "🎯";
              const percent = Math.round((outcome.score ?? 0) * 100);

              return (
                <div key={outcome.skill} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <span>{icon}</span>
                      <span>{label}</span>
                    </span>
                    <span className="font-mono text-xs font-bold">{percent}% ({outcome.level})</span>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Diagnostic Insights */}
        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-accent" />
              <h3 className="font-display text-lg font-bold">AI Diagnostic Summary</h3>
            </div>

            {report.learningSummary ? (
              <p className="text-sm text-muted-foreground leading-relaxed bg-accent/5 p-4 rounded-xl border border-accent/10">
                "{report.learningSummary}"
              </p>
            ) : null}

            {/* Strengths */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-success">
                <TrendingUp className="h-4 w-4" /> Demonstrated Strengths
              </div>
              <div className="flex flex-wrap gap-2">
                {report.strengths && report.strengths.length > 0 ? (
                  report.strengths.map((s) => (
                    <Badge key={s} className="bg-success/15 text-success hover:bg-success/20 capitalize gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {s}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Balanced profile across evaluated skills.</span>
                )}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-warning">
                <TrendingDown className="h-4 w-4" /> Focus Areas to Nurture
              </div>
              <div className="flex flex-wrap gap-2">
                {report.improvements && report.improvements.length > 0 ? (
                  report.improvements.map((w) => (
                    <Badge key={w} variant="secondary" className="capitalize gap-1 border-warning/30">
                      <Target className="h-3 w-3 text-warning" /> {w}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No major weaknesses identified!</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Need help understanding your report?</span>
            <Button variant="ghost" size="sm" className="gap-1 text-primary text-xs" onClick={() => toast.info("Click the floating AI Tutor button anytime to chat about your report!")}>
              <MessageSquare className="h-3.5 w-3.5" /> Ask AI Tutor
            </Button>
          </div>
        </Card>
      </div>

      {/* Recommended Learning Path */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold">Personalized Learning Roadmap</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Based on your diagnostic check-in, our adaptive engine generated this ordered module path to maximize your progress.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 mt-4">
          {report.recommendedLearningPath && Array.isArray(report.recommendedLearningPath) && report.recommendedLearningPath.length > 0 ? (
            report.recommendedLearningPath.map((item: any, idx: number) => (
              <div
                key={item.module_id || idx}
                className="rounded-xl border border-border bg-card p-4 space-y-2 flex flex-col justify-between hover:border-primary/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      Priority {idx + 1}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">{item.skill}</span>
                  </div>
                  <h4 className="font-bold text-sm line-clamp-1">{item.title}</h4>
                </div>
                <Link to="/learn">
                  <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-primary p-0 hover:bg-transparent">
                    <span>Start Module</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>

              </div>
            ))
          ) : (
            <div className="col-span-full p-4 text-center text-sm text-muted-foreground border rounded-xl">
              Curriculum nodes configured to start at Foundation Level.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
