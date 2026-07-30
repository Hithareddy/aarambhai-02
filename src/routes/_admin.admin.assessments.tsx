import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sliders, HelpCircle, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_admin/admin/assessments")({
  component: AdminAssessmentsConfigPage,
});

interface AssessmentConfig {
  total_questions_per_session: number;
  adaptive_enabled: boolean;
  skill_distribution: Record<string, number>;
  difficulty_thresholds: Record<string, { min_score: number; label: string }>;
  supported_languages: string[];
  question_types_supported: string[];
}

function AdminAssessmentsConfigPage() {
  const [config, setConfig] = useState<AssessmentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const data = await apiRequest<AssessmentConfig>("/admin/assessments/config");
        setConfig(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load assessment manager configuration.");
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs font-bold animate-pulse">Loading Assessment Architecture Rules...</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] max-w-md mx-auto text-center gap-4 bg-card border border-border p-8 rounded-3xl">
        <AlertCircle className="h-12 w-12 text-destructive animate-bounce" />
        <h3 className="text-xl font-bold">Configuration Load Error</h3>
        <p className="text-sm text-muted-foreground">{error || "Could not read assessment rules."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-primary">Aarambh AI Diagnostic Rules</span>
        <h1 className="text-3xl font-black text-foreground mt-1">Assessment Manager</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Inspect initial assessment structure, LSRW question balances, adaptive thresholds, and formats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Session Rules */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="border-b border-border/80 px-6 py-5">
            <CardTitle className="text-base font-black text-foreground">Session Parameters</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <span className="text-xs font-bold text-muted-foreground">Questions per Session</span>
              <p className="text-2xl font-black text-foreground mt-0.5">{config.total_questions_per_session} Questions</p>
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground">Adaptive Difficulty</span>
              <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold block w-max mt-1">
                {config.adaptive_enabled ? "Active Adaptive Engine" : "Fixed Sequence"}
              </Badge>
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground">Supported Assessment Languages</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {config.supported_languages.map((lang) => (
                  <Badge key={lang} variant="outline" className="font-bold text-xs capitalize">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skill Weight Distribution */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="border-b border-border/80 px-6 py-5">
            <CardTitle className="text-base font-black text-foreground">LSRW Question Allocation</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {Object.entries(config.skill_distribution).map(([skill, weight]) => (
              <div key={skill} className="flex justify-between items-center p-3 rounded-xl border border-border bg-secondary/50">
                <span className="text-xs font-extrabold capitalize text-foreground">{skill}</span>
                <span className="text-xs font-bold text-primary">{weight} Questions</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Level Threshold Rules */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="border-b border-border/80 px-6 py-5">
            <CardTitle className="text-base font-black text-foreground">Diagnosed Level Thresholds</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {Object.entries(config.difficulty_thresholds).map(([level, info]) => (
              <div key={level} className="flex justify-between items-center p-3 rounded-xl border border-border bg-secondary/50">
                <div>
                  <h4 className="text-xs font-extrabold text-foreground capitalize">{level}</h4>
                  <span className="text-[10px] text-muted-foreground font-semibold">Min Score: {Math.round(info.min_score * 100)}%</span>
                </div>
                <Badge variant="outline" className="text-xs font-bold">
                  {info.label}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Supported Question Types */}
      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader className="border-b border-border/80 px-6 py-5">
          <CardTitle className="text-base font-black text-foreground">Supported Question Formats</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            {config.question_types_supported.map((type) => (
              <Badge key={type} className="bg-primary/10 text-primary border border-primary/20 font-bold px-3 py-1.5 rounded-xl uppercase text-xs">
                {type.replace("_", " ")}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
