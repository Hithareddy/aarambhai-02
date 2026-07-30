import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Users, 
  CheckCircle, 
  BookOpen, 
  HelpCircle, 
  Calendar, 
  TrendingUp, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin/admin/")({
  component: AdminDashboardPage,
});

interface DashboardStats {
  total_learners: number;
  completed_assessments: number;
  active_modules: number;
  total_questions: number;
  recent_learners: Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
    assessment_completed: boolean;
    current_familiarity: string;
  }>;
}

function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await apiRequest<DashboardStats>("/admin/dashboard");
        setStats(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="h-96" />
        </Card>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] max-w-md mx-auto text-center gap-4 bg-card border border-border p-8 rounded-3xl">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-xl font-bold">Error Loading Dashboard</h3>
        <p className="text-sm text-muted-foreground">{error || "An unknown database communication error occurred."}</p>
        <Button onClick={() => window.location.reload()}>Retry Connection</Button>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Learners",
      value: stats.total_learners,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      desc: "Registered learner accounts"
    },
    {
      title: "Completed Placement Checks",
      value: stats.completed_assessments,
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      desc: "Full assessments finished"
    },
    {
      title: "Active Learning Modules",
      value: stats.active_modules,
      icon: BookOpen,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      desc: "CMS published chapters"
    },
    {
      title: "Total Assessment Questions",
      value: stats.total_questions,
      icon: HelpCircle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      desc: "Question bank size"
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-primary">Aarambh AI Core Systems</span>
        <h1 className="text-3xl font-black text-foreground mt-1">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Real-time indicators fetched directly from the PostgreSQL tables.</p>
      </div>

      {/* Grid count cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-border rounded-2xl shadow-sm hover:border-primary/20 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-0.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    Live
                  </span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-black text-foreground">{card.value}</span>
                  <h3 className="text-xs font-bold text-muted-foreground mt-0.5">{card.title}</h3>
                  <p className="text-[10px] text-muted-foreground/80 mt-1">{card.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Learners Registry */}
        <Card className="lg:col-span-2 rounded-2xl border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-border/80">
            <div>
              <CardTitle className="text-lg font-black text-foreground">Recent Learners Registry</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Latest registrations waiting or undergoing checks.</p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-xl font-bold text-xs">
              <Link to={"/admin/learners" as any}>View All Registry</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recent_learners.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <Users className="h-10 w-10 text-muted-foreground/60 mb-2 animate-bounce" />
                <p className="text-sm font-bold">No registered learners found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
                      <th className="px-6 py-3.5">Learner Name</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Joined Date</th>
                      <th className="px-6 py-3.5">Placement Checked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {stats.recent_learners.map((learner) => (
                      <tr key={learner.id} className="hover:bg-muted/10">
                        <td className="px-6 py-4">
                          <Link to={`/admin/learners/${learner.id}` as any} className="font-extrabold text-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                            {learner.name}
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-semibold">{learner.email}</td>
                        <td className="px-6 py-4 text-muted-foreground font-semibold flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          {new Date(learner.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={learner.assessment_completed ? "default" : "outline"} className={`rounded-lg text-[10px] font-bold px-2 py-0.5 ${
                            learner.assessment_completed ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground"
                          }`}>
                            {learner.assessment_completed ? "Completed" : "Not Completed"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Administrator Quick Actions panel */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="border-b border-border/80 px-6 py-5">
            <CardTitle className="text-lg font-black text-foreground">Quick Admin Operations</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">CMS and curriculum operations shortcut panels.</p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-extrabold text-foreground">Verified Admin Account</h4>
                <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                  You possess absolute superuser privileges to direct database curriculum blocks and check student timelines.
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Button asChild variant="outline" className="w-full justify-start rounded-xl font-bold h-11 border-border text-xs">
                <Link to={"/admin/questions" as any}>Manage Question Bank →</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-xl font-bold h-11 border-border text-xs">
                <Link to={"/admin/modules" as any}>Manage Modular Lessons →</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-xl font-bold h-11 border-border text-xs">
                <Link to={"/admin/results" as any}>Inspect Assessments History →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
