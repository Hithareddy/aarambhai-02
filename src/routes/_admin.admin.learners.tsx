import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Search, Calendar, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_admin/admin/learners")({
  component: AdminLearnersPage,
});

interface LearnerSummary {
  id: string;
  name: string;
  email: string;
  created_at: string;
  age_group: string | null;
  educational_background: string | null;
  current_role: string | null;
  learning_language: string | null;
  assessment_completed: boolean;
  current_level: string;
}

function AdminLearnersPage() {
  const [learners, setLearners] = useState<LearnerSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLearners() {
      try {
        const data = await apiRequest<LearnerSummary[]>(`/admin/learners${search ? `?search=${encodeURIComponent(search)}` : ""}`);
        setLearners(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load registered learners.");
      } finally {
        setLoading(false);
      }
    }
    const delayDebounce = setTimeout(() => {
      fetchLearners();
    }, search ? 300 : 0);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-primary">Aarambh AI Learner Registry</span>
          <h1 className="text-3xl font-black text-foreground mt-1">Learners Registry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Inspect profile configurations, placements, and syllabus timelines.</p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search name or email..."
            className="pl-9 h-11 rounded-2xl border-border"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setLoading(true);
            }}
          />
        </div>
      </div>

      <Card className="rounded-2xl border-border shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs font-bold animate-pulse">Querying Learner Database...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-16 text-center gap-2">
              <AlertCircle className="h-10 w-10 text-destructive animate-pulse" />
              <h3 className="text-md font-bold">Query Error</h3>
              <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
            </div>
          ) : learners.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-24 text-center text-muted-foreground gap-2">
              <Users className="h-12 w-12 text-muted-foreground/45" />
              <p className="text-sm font-bold">No registered learners found matching criteria.</p>
              <p className="text-xs text-muted-foreground/80">Only standard student accounts are tracked; superusers are excluded.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
                    <th className="px-6 py-4">Learner Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Language / Role</th>
                    <th className="px-6 py-4">Current Level</th>
                    <th className="px-6 py-4">Joined Date</th>
                    <th className="px-6 py-4">Placement Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {learners.map((learner) => (
                    <tr key={learner.id} className="hover:bg-muted/5">
                      <td className="px-6 py-4">
                        <Link to={`/admin/learners/${learner.id}` as any} className="font-extrabold text-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                          {learner.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-semibold">{learner.email}</td>
                      <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                        <div className="flex flex-col gap-0.5">
                          <span>Lang: <span className="font-bold text-foreground capitalize">{learner.learning_language || "Not Configured"}</span></span>
                          <span>Role: <span className="font-bold text-foreground">{learner.current_role || "Not Configured"}</span></span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-extrabold rounded-lg text-xs capitalize">
                          {learner.current_level}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          {new Date(learner.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={learner.assessment_completed ? "default" : "outline"} className={`rounded-lg text-[10px] font-bold px-2 py-0.5 ${
                          learner.assessment_completed ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground"
                        }`}>
                          {learner.assessment_completed ? "Completed" : "Not Started"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button asChild variant="ghost" size="sm" className="font-bold text-xs gap-1 hover:text-primary rounded-xl">
                          <Link to={`/admin/learners/${learner.id}` as any}>
                            Inspect Profile
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
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
    </div>
  );
}
