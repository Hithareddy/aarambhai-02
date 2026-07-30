import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Globe, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_admin/admin/languages")({
  component: AdminLanguagesCoveragePage,
});

interface LanguageCoverageItem {
  language_code: string;
  language_name: string;
  website_learners: number;
  learning_learners: number;
  questions_count: number;
  modules_count: number;
  lessons_count: number;
  games_count: number;
  coverage_percentage: number;
}

function AdminLanguagesCoveragePage() {
  const [languages, setLanguages] = useState<LanguageCoverageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLanguages() {
      try {
        const data = await apiRequest<LanguageCoverageItem[]>("/admin/languages/coverage");
        setLanguages(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load language coverage metrics.");
      } finally {
        setLoading(false);
      }
    }
    fetchLanguages();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs font-bold animate-pulse">Calculating Language Coverage Metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] max-w-md mx-auto text-center gap-4 bg-card border border-border p-8 rounded-3xl">
        <AlertCircle className="h-12 w-12 text-destructive animate-bounce" />
        <h3 className="text-xl font-bold">Language Audit Error</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-primary">Aarambh AI Multilingual Audit</span>
        <h1 className="text-3xl font-black text-foreground mt-1">Languages & Content Coverage</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Separate metrics for Website Interface Language vs Learning Language, with real content translation coverage %.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {languages.map((lang) => (
          <Card key={lang.language_code} className="rounded-2xl border-border shadow-sm">
            <CardHeader className="border-b border-border/80 px-6 py-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {lang.language_name}
                </CardTitle>
                <span className="text-[10px] font-mono text-muted-foreground font-bold uppercase mt-0.5 block">Code: {lang.language_code}</span>
              </div>
              <Badge variant="outline" className="font-extrabold text-xs">
                {Math.round(lang.coverage_percentage)}% Coverage
              </Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                  <span>Translation Readiness</span>
                  <span>{Math.round(lang.coverage_percentage)}%</span>
                </div>
                <Progress value={lang.coverage_percentage} className="h-2 rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-bold text-muted-foreground">
                <div className="p-2.5 rounded-xl border border-border bg-secondary/50">
                  <span className="text-[9px] uppercase block">UI Language Learners</span>
                  <span className="text-base font-black text-foreground">{lang.website_learners}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-border bg-secondary/50">
                  <span className="text-[9px] uppercase block">Target Language Learners</span>
                  <span className="text-base font-black text-foreground">{lang.learning_learners}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border text-xs font-semibold text-muted-foreground">
                <div className="flex justify-between">
                  <span>Assessment Questions:</span>
                  <span className="font-extrabold text-foreground">{lang.questions_count} Qs</span>
                </div>
                <div className="flex justify-between">
                  <span>Syllabus Modules:</span>
                  <span className="font-extrabold text-foreground">{lang.modules_count} Modules</span>
                </div>
                <div className="flex justify-between">
                  <span>Syllabus Lessons:</span>
                  <span className="font-extrabold text-foreground">{lang.lessons_count} Lessons</span>
                </div>
                <div className="flex justify-between">
                  <span>Practice Games:</span>
                  <span className="font-extrabold text-foreground">{lang.games_count} Games</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
