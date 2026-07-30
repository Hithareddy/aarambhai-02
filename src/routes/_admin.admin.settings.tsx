import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings, ShieldCheck, User, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api/http";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_admin/admin/settings")({
  component: AdminSettingsPage,
});

interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  is_superuser: boolean;
  is_active: boolean;
  created_at: string;
}

function AdminSettingsPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdminProfile() {
      try {
        const data = await apiRequest<AdminProfile>("/users/me");
        setProfile(data);
      } catch (err) {
        setError((err as Error).message || "Failed to load admin settings.");
      } finally {
        setLoading(false);
      }
    }
    fetchAdminProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs font-bold animate-pulse">Loading Admin Profile Settings...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] max-w-md mx-auto text-center gap-4 bg-card border border-border p-8 rounded-3xl">
        <AlertCircle className="h-12 w-12 text-destructive animate-bounce" />
        <h3 className="text-xl font-bold">Settings Load Error</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-primary">Aarambh AI System Privileges</span>
        <h1 className="text-3xl font-black text-foreground mt-1">Admin Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Inspect current administrator account credentials, database access scope, and security roles.</p>
      </div>

      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader className="border-b border-border/80 px-6 py-5 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Superuser Credentials & Role Scope
          </CardTitle>
          <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold px-3 py-1 text-xs">
            Superuser Verified
          </Badge>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Admin Full Name</span>
            <p className="text-base font-extrabold text-foreground mt-0.5">{profile.full_name || "Administrator"}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Registered Admin Email</span>
            <p className="text-base font-extrabold text-foreground mt-0.5">{profile.email}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Account Created Date</span>
            <p className="text-sm font-semibold text-muted-foreground mt-0.5">{new Date(profile.created_at).toLocaleDateString()}</p>
          </div>

          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 pt-4 border-t border-border/60">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-extrabold text-foreground">PostgreSQL System Ownership</h4>
              <p className="text-xs text-muted-foreground leading-normal mt-0.5">
                Your account possesses absolute superuser access to query, create, update, and manage assessment questions, syllabus modules, learner registry profiles, and system announcements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
