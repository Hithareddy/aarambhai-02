import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Route as RouteIcon, Search, Loader2, AlertCircle, ChevronRight, Sparkles, BookOpen } from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin/admin/learning-paths")({
  component: AdminLearningPathsPage,
});

interface LearningPathItem {
  learner_id: string;
  learner_name: string;
  learner_email: string;
  diagnosed_level: string;
  learning_goal: string | null;
  weak_skills: string[];
  current_module: string | null;
  path_steps: Array<{
    module_id: string;
    title: string;
    skill: string;
    reason: string;
    status: string;
  }>;
}

function AdminLearningPathsPage() {
  const [paths, setPaths] = useState<LearningPathItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLearningPaths() {
      try {
        const data = await apiRequest<LearningPathItem[]>(`/admin/learning-paths${search ? `?search=${encodeURIComponent(search)}` : ""}`);
        setPaths(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load personalized learning paths.");
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(() => {
      fetchLearningPaths();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-primary">Aarambh AI Adaptive Engine</span>
          <h1 className="text-3xl font-black text-foreground mt-1">Personalized Learning Paths</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Inspect generated roadmaps and clear explanations for why modules were assigned.</p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search learner..."
            className="pl-9 h-11 rounded-2xl border-border"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLoading(true);
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs font-bold animate-pulse">Querying Adaptive Engine Paths...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-16 text-center gap-2">
          <AlertCircle className="h-10 w-10 text-destructive animate-bounce" />
          <h3 className="text-md font-bold">Query Error</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      ) : paths.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 text-center text-muted-foreground gap-2">
          <RouteIcon className="h-12 w-12 text-muted-foreground/45" />
          <p className="text-sm font-bold">No active learning paths generated yet.</p>
          <p className="text-xs text-muted-foreground/80">Personalized paths are generated automatically after initial placement.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {paths.map((p) => (
            <Card key={p.learner_id} className="rounded-2xl border-border shadow-sm">
              <CardHeader className="border-b border-border/80 px-6 py-5 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-black text-foreground">{p.learner_name}</CardTitle>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold text-xs capitalize">
                      {p.diagnosed_level}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.learner_email} • Goal: {p.learning_goal || "General Literacy"}</p>
                </div>
                <Button asChild variant="ghost" size="sm" className="font-bold text-xs gap-1 rounded-xl">
                  <Link to={`/admin/learners/${p.learner_id}` as any}>
                    Full Inspector
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <span>Weak Focus Areas:</span>
                  {p.weak_skills.length === 0 ? (
                    <span className="italic text-emerald-500 font-semibold">Balanced across skills</span>
                  ) : (
                    p.weak_skills.map((ws) => (
                      <Badge key={ws} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold capitalize text-[10px] px-2 py-0.5">
                        {ws}
                      </Badge>
                    ))
                  )}
                </div>

                <div className="space-y-2.5 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground">Assigned Module Timeline & Rationale</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {p.path_steps.map((step, idx) => (
                      <div key={step.module_id} className="p-4 rounded-xl border border-border bg-secondary/50 flex items-start gap-3">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-sm font-extrabold text-foreground truncate">{step.title}</h5>
                            <Badge variant="outline" className="text-[9px] font-bold capitalize px-1.5 py-0">
                              {step.skill}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-normal font-medium">
                            <span className="font-bold text-foreground">Why assigned:</span> {step.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
