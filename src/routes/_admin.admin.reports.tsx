import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Users, Award, BookOpen, AlertCircle, Loader2, TrendingUp, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_admin/admin/reports")({
  component: AdminReportsPage,
});

interface PlatformReportStats {
  total_learners: number;
  assessment_completion_rate: number;
  avg_accuracy_score: number;
  skill_averages: {
    listening: number;
    speaking: number;
    reading: number;
    writing: number;
  };
  level_counts: Record<string, number>;
  most_common_weaknesses: Array<{ skill: string; count: number }>;
  lesson_completions_total: number;
}

function AdminReportsPage() {
  const [stats, setStats] = useState<PlatformReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const data = await apiRequest<PlatformReportStats>("/admin/reports/summary");
        setStats(data);
      } catch (err) {
        setError((err as Error).message || "Failed to query analytics reports.");
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs font-bold animate-pulse">Calculating Real Database Analytics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] max-w-md mx-auto text-center gap-4 bg-card border border-border p-8 rounded-3xl">
        <AlertCircle className="h-12 w-12 text-destructive animate-bounce" />
        <h3 className="text-xl font-bold">Analytics Report Error</h3>
        <p className="text-sm text-muted-foreground">{error || "Could not query PostgreSQL database analytics."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-primary">Aarambh AI Analytics Center</span>
        <h1 className="text-3xl font-black text-foreground mt-1">Progress & Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Comprehensive real-time platform metrics derived strictly from PostgreSQL activity logs.</p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground">Total Registered</span>
              <p className="text-2xl font-black text-foreground mt-1">{stats.total_learners}</p>
            </div>
            <Users className="h-8 w-8 text-primary/80" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground">Assessment Completion</span>
              <p className="text-2xl font-black text-foreground mt-1">{(stats.assessment_completion_rate * 100).toFixed(1)}%</p>
            </div>
            <Award className="h-8 w-8 text-emerald-500/80" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground">Avg Accuracy</span>
              <p className="text-2xl font-black text-foreground mt-1">{(stats.avg_accuracy_score * 100).toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500/80" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground">Lesson Progress Logs</span>
              <p className="text-2xl font-black text-foreground mt-1">{stats.lesson_completions_total}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-amber-500/80" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average LSRW Performance Breakdown */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="border-b border-border/80 px-6 py-5">
            <CardTitle className="text-base font-black text-foreground">Average LSRW Skill Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>Listening</span>
                <span>{Math.round(stats.skill_averages.listening * 100)}%</span>
              </div>
              <Progress value={stats.skill_averages.listening * 100} className="h-2 rounded-full" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>Speaking</span>
                <span>{Math.round(stats.skill_averages.speaking * 100)}%</span>
              </div>
              <Progress value={stats.skill_averages.speaking * 100} className="h-2 rounded-full" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>Reading</span>
                <span>{Math.round(stats.skill_averages.reading * 100)}%</span>
              </div>
              <Progress value={stats.skill_averages.reading * 100} className="h-2 rounded-full" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>Writing</span>
                <span>{Math.round(stats.skill_averages.writing * 100)}%</span>
              </div>
              <Progress value={stats.skill_averages.writing * 100} className="h-2 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Level Distribution & Most Common Weaknesses */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="border-b border-border/80 px-6 py-5">
            <CardTitle className="text-base font-black text-foreground">Diagnosed Level Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(stats.level_counts).map(([lvl, count]) => (
                <div key={lvl} className="p-3 rounded-xl border border-border bg-secondary/50 text-center">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">{lvl}</span>
                  <span className="text-lg font-black text-foreground mt-0.5 block">{count}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Most Common Weak Focus Areas</h4>
              <div className="flex flex-wrap gap-2">
                {stats.most_common_weaknesses.map((w) => (
                  <Badge key={w.skill} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold capitalize text-xs px-3 py-1">
                    {w.skill}: {w.count} learners
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
