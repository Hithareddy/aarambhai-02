import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Award, 
  Calendar, 
  ChevronRight, 
  AlertCircle, 
  Loader2,
  X 
} from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_admin/admin/results")({
  component: AdminResultsHistoryPage,
});

interface AssessmentResultSummary {
  id: string;
  session_id: string;
  learner_id: string;
  learner_name: string;
  learner_email: string;
  overall_proficiency: string;
  confidence_score: number;
  readiness_level: string;
  created_at: string;
}

interface AssessmentResultDetails {
  id: string;
  session_id: string;
  learner_id: string;
  learner_name: string;
  learner_email: string;
  overall_proficiency: string;
  confidence_score: number;
  readiness_level: string;
  skill_proficiencies: Array<{
    skill: string;
    proficiency: number;
    questions_asked: number;
  }>;
  strengths: string[];
  weaknesses: string[];
  learning_summary: string | null;
  learning_path: Array<{
    module_id: string;
    title: string;
    skill: string;
    priority: number;
  }>;
  created_at: string;
}

function AdminResultsHistoryPage() {
  const [results, setResults] = useState<AssessmentResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal state
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AssessmentResultDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function fetchResults() {
    try {
      const data = await apiRequest<AssessmentResultSummary[]>("/admin/results");
      setResults(data);
    } catch (err) {
      setError((err as Error).message || "Failed to load placement history records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    async function fetchDetails() {
      if (!detailId) {
        setDetail(null);
        return;
      }
      setDetailLoading(true);
      try {
        const data = await apiRequest<AssessmentResultDetails>(`/admin/results/${detailId}`);
        setDetail(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load assessment result details.");
      } finally {
        setDetailLoading(false);
      }
    }
    fetchDetails();
  }, [detailId]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-primary">Aarambh AI Placement Records</span>
        <h1 className="text-3xl font-black text-foreground mt-1">Assessment Results</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Browse history checks and diagnostic blueprints issued by the system.</p>
      </div>

      <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs font-bold animate-pulse">Querying Placement History...</p>
            </div>
          ) : error && !detailId ? (
            <div className="flex flex-col items-center justify-center p-16 text-center gap-2">
              <AlertCircle className="h-10 w-10 text-destructive animate-bounce" />
              <h3 className="text-md font-bold">Query Error</h3>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center text-muted-foreground gap-2">
              <Award className="h-12 w-12 text-muted-foreground/45" />
              <p className="text-sm font-bold">No placement assessments finished yet.</p>
              <p className="text-xs text-muted-foreground/80">Completed learner placements will automatically register here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
                    <th className="px-6 py-4">Learner Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Overall Level</th>
                    <th className="px-6 py-4">Accuracy Score</th>
                    <th className="px-6 py-4">Placement Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {results.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/5">
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-foreground">{r.learner_name}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-semibold">{r.learner_email}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-extrabold rounded-lg text-xs">
                          {r.overall_proficiency}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {(r.confidence_score * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button onClick={() => setDetailId(r.id)} variant="ghost" size="sm" className="font-bold text-xs gap-1 hover:text-primary rounded-xl">
                          View Details
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Detail Modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-xl rounded-3xl border-border shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/80 px-6 py-5 shrink-0">
              <CardTitle className="text-lg font-black text-foreground flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Placement Diagnostics Details
              </CardTitle>
              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => setDetailId(null)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center p-24 gap-3 text-muted-foreground">
                  <Loader2 className="h-7 w-7 text-primary animate-spin" />
                  <p className="text-xs font-bold animate-pulse">Retrieving Assessment Results...</p>
                </div>
              ) : !detail ? (
                <div className="p-3 border border-destructive/20 bg-destructive/5 text-xs text-destructive font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Failed to load results.</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top Stats */}
                  <div className="grid grid-cols-3 gap-4 border-b border-border pb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Overall Level</span>
                      <p className="text-lg font-black text-primary mt-0.5">{detail.overall_proficiency}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Accuracy Score</span>
                      <p className="text-lg font-black text-foreground mt-0.5">{(detail.confidence_score * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Readiness</span>
                      <p className="text-lg font-black text-foreground mt-0.5">{detail.readiness_level}</p>
                    </div>
                  </div>

                  {/* Learner Info */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Learner info</span>
                    <p className="text-sm font-extrabold text-foreground mt-0.5">{detail.learner_name}</p>
                    <p className="text-xs text-muted-foreground">{detail.learner_email}</p>
                  </div>

                  {/* Skill scores progress */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-foreground tracking-wider">Skill Level Breakdowns</h3>
                    <div className="space-y-2">
                      {detail.skill_proficiencies.map((item) => (
                        <div key={item.skill} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold capitalize text-muted-foreground">
                            <span>{item.skill}</span>
                            <span>{Math.round(item.proficiency * 100)}%</span>
                          </div>
                          <Progress value={item.proficiency * 100} className="h-1.5 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="space-y-1.5">
                      <span className="text-xs font-black uppercase text-foreground tracking-wider block">Strengths</span>
                      <div className="flex flex-wrap gap-1">
                        {detail.strengths.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic font-semibold">None recorded</span>
                        ) : (
                          detail.strengths.map((s) => (
                            <Badge key={s} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold capitalize rounded-lg px-2 py-0.5 text-[10px]">
                              {s}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-black uppercase text-foreground tracking-wider block">Focus Areas</span>
                      <div className="flex flex-wrap gap-1">
                        {detail.weaknesses.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic font-semibold">None recorded</span>
                        ) : (
                          detail.weaknesses.map((w) => (
                            <Badge key={w} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold capitalize rounded-lg px-2 py-0.5 text-[10px]">
                              {w}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic timeline generated */}
                  <div className="border-t border-border pt-4 space-y-2">
                    <h3 className="text-xs font-black uppercase text-foreground tracking-wider">Dynamic Timeline Generated</h3>
                    <div className="space-y-1.5">
                      {detail.learning_path.map((step) => (
                        <div key={step.module_id} className="flex items-center gap-3 p-2.5 bg-secondary rounded-xl border border-border">
                          <div className="h-6 w-6 rounded bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
                            {step.priority}
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-foreground leading-none">{step.title}</h4>
                            <span className="text-[9px] font-bold text-muted-foreground capitalize block mt-0.5">Skill Focus: {step.skill}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
