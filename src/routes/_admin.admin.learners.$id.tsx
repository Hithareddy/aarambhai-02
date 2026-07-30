import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  ArrowLeft, 
  User, 
  GraduationCap, 
  Activity, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Loader2 
} from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_admin/admin/learners/$id")({
  component: AdminLearnerDetailPage,
});

interface LearnerDetails {
  id: string;
  name: string;
  email: string;
  created_at: string;
  profile: {
    age_group: string | null;
    educational_background: string | null;
    current_role: string | null;
    learning_goal: string | null;
    learning_language: string | null;
    website_language: string | null;
    assessment_completed: boolean;
    tutor_name: string | null;
  } | null;
  latest_assessment: {
    id: string;
    overall_proficiency: string;
    confidence_score: number;
    readiness_level: string;
    strengths: string[];
    weaknesses: string[];
    skill_proficiencies: Array<{
      skill: string;
      proficiency: number;
      questions_asked: number;
    }>;
    learning_path: Array<{
      module_id: string;
      title: string;
      skill: string;
      priority: number;
    }>;
    created_at: string;
  } | null;
  lesson_progress: Array<{
    lesson_id: string;
    title: string;
    status: string;
    progress_percentage: number;
    completed_at: string | null;
    time_spent_seconds: number;
  }>;
}

function AdminLearnerDetailPage() {
  const { id } = Route.useParams();
  const [details, setDetails] = useState<LearnerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const data = await apiRequest<LearnerDetails>(`/admin/learners/${id}`);
        setDetails(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load learner details.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs font-bold animate-pulse">Loading Learner History Profile...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] max-w-md mx-auto text-center gap-4 bg-card border border-border p-8 rounded-3xl">
        <AlertCircle className="h-12 w-12 text-destructive animate-bounce" />
        <h3 className="text-xl font-bold">Error Loading Learner</h3>
        <p className="text-sm text-muted-foreground">{error || "Could not connect to database record."}</p>
        <Button asChild variant="outline" className="rounded-xl font-bold text-xs mt-2">
          <Link to={"/admin/learners" as any}>Back to Learners Registry</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Back CTA */}
      <div>
        <Button asChild variant="ghost" className="rounded-xl font-bold text-xs gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
          <Link to={"/admin/learners" as any}>
            <ArrowLeft className="h-4 w-4" />
            Back to Learners Registry
          </Link>
        </Button>
        <h1 className="text-3xl font-black text-foreground mt-2">{details.name}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{details.email} • Joined on {new Date(details.created_at).toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card & Info */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="border-b border-border/80 px-6 py-5">
              <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Demographics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Age Group</span>
                <p className="text-sm font-extrabold text-foreground mt-0.5">{details.profile?.age_group || "Not Configured"}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Education Background</span>
                <p className="text-sm font-extrabold text-foreground mt-0.5">{details.profile?.educational_background || "Not Configured"}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">User / Learner Type</span>
                <p className="text-sm font-extrabold text-foreground mt-0.5">{details.profile?.current_role || "Not Configured"}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Learning Language</span>
                <p className="text-sm font-extrabold text-foreground mt-0.5 capitalize">{details.profile?.learning_language || "Not Configured"}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">AI Tutor Guide</span>
                <p className="text-sm font-extrabold text-foreground mt-0.5">{details.profile?.tutor_name || "Mira"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment & Learning Path details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="border-b border-border/80 px-6 py-5">
              <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Placement Results & Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!details.latest_assessment ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <Activity className="h-10 w-10 text-muted-foreground/60 mb-2 animate-pulse" />
                  <p className="text-sm font-bold">No placement assessment records completed.</p>
                  <p className="text-xs text-muted-foreground mt-0.5">The learner has not finished the initial Placement Assessment check-in.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top Diagnostics stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-border pb-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Overall Proficiency</span>
                      <p className="text-xl font-black text-primary mt-0.5">{details.latest_assessment.overall_proficiency}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Accuracy Score</span>
                      <p className="text-xl font-black text-foreground mt-0.5">{(details.latest_assessment.confidence_score * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Readiness Status</span>
                      <p className="text-xl font-black text-foreground mt-0.5">{details.latest_assessment.readiness_level}</p>
                    </div>
                  </div>

                  {/* Skill level breakdown progress bars */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase text-foreground tracking-wider">Skill Breakdown Diagnostics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {details.latest_assessment.skill_proficiencies.map((item) => (
                        <div key={item.skill} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold capitalize text-muted-foreground">
                            <span>{item.skill}</span>
                            <span>{Math.round(item.proficiency * 100)}% ({item.questions_asked} Qs)</span>
                          </div>
                          <Progress value={item.proficiency * 100} className="h-2 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths & Areas needing improvements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-6">
                    <div className="space-y-2">
                      <span className="text-xs font-black uppercase text-foreground tracking-wider block">Diagnosed Strengths</span>
                      <div className="flex flex-wrap gap-1.5">
                        {details.latest_assessment.strengths.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic font-semibold">None recorded yet</span>
                        ) : (
                          details.latest_assessment.strengths.map((str) => (
                            <Badge key={str} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold capitalize rounded-lg px-2.5 py-0.5">
                              {str}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-black uppercase text-foreground tracking-wider block">Areas Needing Improvement</span>
                      <div className="flex flex-wrap gap-1.5">
                        {details.latest_assessment.weaknesses.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic font-semibold">None recorded yet</span>
                        ) : (
                          details.latest_assessment.weaknesses.map((weak) => (
                            <Badge key={weak} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold capitalize rounded-lg px-2.5 py-0.5">
                              {weak}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recommended learning path steps */}
                  <div className="border-t border-border pt-6 space-y-3">
                    <h3 className="text-xs font-black uppercase text-foreground tracking-wider">Dynamic Learning Path Roadmaps</h3>
                    <div className="space-y-2">
                      {details.latest_assessment.learning_path.map((step) => (
                        <div key={step.module_id} className="flex items-center gap-3 p-3 bg-secondary rounded-2xl border border-border">
                          <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
                            {step.priority}
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-foreground leading-none">{step.title}</h4>
                            <span className="text-[10px] font-bold text-muted-foreground capitalize mt-1 block">Skill Focus: {step.skill}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lesson Completion Progress Timeline */}
          <Card className="rounded-2xl border-border shadow-sm">
            <CardHeader className="border-b border-border/80 px-6 py-5">
              <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Lesson Progress History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {details.lesson_progress.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <GraduationCap className="h-10 w-10 text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-bold">No active lesson study records found.</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Learner has not logged progress in learning modules.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
                        <th className="px-6 py-3.5">Lesson Title</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Completion %</th>
                        <th className="px-6 py-3.5">Study Duration</th>
                        <th className="px-6 py-3.5">Completed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {details.lesson_progress.map((prog) => (
                        <tr key={prog.lesson_id} className="hover:bg-muted/10">
                          <td className="px-6 py-4 font-extrabold text-foreground">{prog.title}</td>
                          <td className="px-6 py-4">
                            <Badge variant={prog.status === "completed" ? "default" : "outline"} className={`rounded-lg text-[10px] font-bold px-2 py-0.5 ${
                              prog.status === "completed" 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                : prog.status === "in_progress" 
                                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                  : "bg-muted text-muted-foreground"
                            }`}>
                              {prog.status === "completed" ? "Completed" : prog.status === "in_progress" ? "In Progress" : "Not Started"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-bold text-muted-foreground">{Math.round(prog.progress_percentage)}%</td>
                          <td className="px-6 py-4 text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            {Math.round(prog.time_spent_seconds / 60)} min
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">
                            {prog.completed_at ? new Date(prog.completed_at).toLocaleDateString() : "Pending"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
