import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  Globe,
  GraduationCap,
  Layers,
  Mail,
  Pencil,
  Shield,
  Sparkles,
  Target,
  Trophy,
  User,
  Zap,
  Loader2,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/api/http";
import { getLearnerProfile, updateLearnerProfile, type LearnerProfile } from "@/lib/api/learner";
import { getAssessmentHistory, type AssessmentResult } from "@/lib/api/assessment";
import { useLanguage } from "@/hooks/use-language";
import { toast } from "sonner";


export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Learner Identity Hub — Aarambh AI" }] }),
  component: ProfilePage,
});

interface BackendUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

interface GamificationData {
  xp: number;
  level: number;
  streak_days: number;
  longest_streak: number;
}

function ProfilePage() {
  const { websiteLanguage, setWebsiteLanguage, setTargetLanguage, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<BackendUser | null>(null);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentResult[]>([]);
  const [wordsCount, setWordsCount] = useState<number>(0);
  const [achievements, setAchievements] = useState<any[]>([]);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAgeGroup, setEditAgeGroup] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [editLearningLang, setEditLearningLang] = useState("");
  const [editWebsiteLang, setEditWebsiteLang] = useState("");
  const [editDailyGoal, setEditDailyGoal] = useState(20);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [u, p, g, h, w, a] = await Promise.all([
        apiRequest<BackendUser>("/auth/me").catch(() => null),
        getLearnerProfile().catch(() => null),
        apiRequest<GamificationData>("/users/me/gamification").catch(() => null),
        getAssessmentHistory().catch(() => []),
        apiRequest<any>("/vocabulary/my-words").catch(() => ({ words: [], total_count: 0 })),
        apiRequest<any[]>("/users/me/achievements").catch(() => []),
      ]);
      if (u) setUser(u);
      if (p) setProfile(p);
      if (g) setGamification(g);
      if (h) setAssessmentHistory(h);
      if (w) setWordsCount(w.total_count || 0);
      if (a) setAchievements(a);

    } catch (err) {
      toast.error("Failed to load profile identity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const openEditModal = () => {
    if (profile) {
      setEditName(profile.name || user?.full_name || "");
      setEditAgeGroup(profile.age_group || "student");
      setEditRole(profile.current_role || "Student");
      setEditGoal(profile.learning_goal || "Everyday Communication");
      setEditLearningLang(profile.learning_language || "en");
      setEditWebsiteLang(profile.website_language || "en");
      setEditDailyGoal(profile.daily_goal_minutes || 20);
    } else {
      setEditName(user?.full_name || "");
      setEditAgeGroup("student");
      setEditRole("Student");
      setEditGoal("Everyday Communication");
      setEditLearningLang("en");
      setEditWebsiteLang("en");
      setEditDailyGoal(20);
    }
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updated = await updateLearnerProfile({
        name: editName,
        age_group: editAgeGroup,
        current_role: editRole,
        learning_goal: editGoal,
        learning_language: editLearningLang,
        website_language: editWebsiteLang,
        daily_goal_minutes: editDailyGoal,
      });

      setProfile(updated);
      setWebsiteLanguage(editWebsiteLang as any);
      setTargetLanguage(editLearningLang as any);

      toast.success("Profile identity updated successfully!");
      setEditOpen(false);
    } catch (err) {
      toast.error("Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const displayName = profile?.name || user?.full_name || "Aarambh Learner";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const langMap: Record<string, string> = {
    en: "English",
    te: "తెలుగు (Telugu)",
    hi: "हिंदी (Hindi)",
  };

  const latestAssessment = assessmentHistory.length > 0 ? assessmentHistory[0] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learner Identity Hub"
        title="Personal Learning Profile & Badges"
        description="Real-time profile, diagnostic assessment status, active streaks, and earned milestone badges."
        actions={
          <Button onClick={openEditModal} className="gap-2 shadow-sm">
            <Pencil className="h-4 w-4" /> Edit Profile Details
          </Button>
        }
      />

      {/* Main Profile Header Banner */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 via-card to-accent/5 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/30 shadow-md">
              <AvatarFallback className="bg-primary text-xl font-bold text-primary-foreground font-display">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-2xl font-bold text-foreground">{displayName}</h2>
                <Badge className="bg-primary text-primary-foreground font-mono">
                  Level {gamification?.level || 1}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span>{user?.email}</span>
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline" className="text-xs gap-1 bg-background/60">
                  <Globe className="h-3 w-3 text-emerald-500" />
                  Target: {langMap[profile?.learning_language || "en"] || "English"}
                </Badge>
                <Badge variant="outline" className="text-xs gap-1 bg-background/60">
                  <User className="h-3 w-3 text-accent" />
                  Role: {profile?.current_role || "Student"}
                </Badge>
                {latestAssessment && (
                  <Badge variant="secondary" className="text-xs gap-1 font-bold">
                    <Brain className="h-3 w-3 text-purple-500" />
                    CEFR: {latestAssessment.overallLevel}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-background/80 p-3.5 rounded-2xl border border-border/60 self-stretch sm:self-auto justify-around shadow-sm">
            <div className="text-center px-2">
              <p className="text-xl font-black text-amber-500 font-display flex items-center justify-center gap-1">
                <Zap className="h-4 w-4 fill-amber-500" /> {gamification?.xp || 0}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Total XP</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center px-2">
              <p className="text-xl font-black text-orange-500 font-display flex items-center justify-center gap-1">
                <Flame className="h-4 w-4 fill-orange-500" /> {gamification?.streak_days || 1}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Streak Days</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center px-2">
              <p className="text-xl font-black text-emerald-500 font-display">
                {wordsCount}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Words Learned</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Personal Info & Learning Preferences */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold">Personal Profile Information</h3>
          </div>
          <div className="grid gap-3.5 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Full Name:</span>
              <span className="font-semibold">{displayName}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Account Email:</span>
              <span className="font-semibold font-mono text-xs">{user?.email}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Age Group:</span>
              <span className="font-semibold capitalize">{profile?.age_group || "Student"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Learner Role:</span>
              <span className="font-semibold capitalize">{profile?.current_role || "Student"}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            <h3 className="font-display text-lg font-bold">Learning Preferences & Goals</h3>
          </div>
          <div className="grid gap-3.5 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Target Learning Language:</span>
              <span className="font-semibold">{langMap[profile?.learning_language || "en"]}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Interface Website Language:</span>
              <span className="font-semibold">{langMap[profile?.website_language || "en"]}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Primary Learning Goal:</span>
              <span className="font-semibold">{profile?.learning_goal || "Everyday Communication"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground font-medium">Daily Goal Target:</span>
              <span className="font-semibold">{profile?.daily_goal_minutes || 20} Minutes / Day</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Assessment History Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <h3 className="font-display text-lg font-bold">Diagnostic Assessment History</h3>
          </div>
          <Link to="/reports">
            <Button size="sm" variant="ghost" className="text-xs gap-1 text-primary">
              View Full Report →
            </Button>
          </Link>
        </div>

        {assessmentHistory.length > 0 ? (
          <div className="space-y-3">
            {assessmentHistory.map((rec) => (
              <div key={rec.sessionId} className="p-4 rounded-xl border bg-card/60 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{rec.readinessLevel || "Placement Check"}</span>
                    <Badge variant="outline" className="text-[10px]">CEFR {rec.overallLevel}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Confidence: {Math.round((rec.confidenceScore || 0) * 100)}% • Completed: {new Date(rec.completedAt).toLocaleDateString()}
                  </p>
                </div>
                <Link to="/reports">
                  <Button size="sm" variant="outline" className="text-xs">Report</Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (

          <div className="p-6 text-center text-xs text-muted-foreground border rounded-xl border-dashed">
            No diagnostic placement check-in completed yet. Complete your initial check-in to see your CEFR placement!
          </div>
        )}
      </Card>

      {/* Earned Badges & Achievements Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h3 className="font-display text-lg font-bold">Earned Badges & Milestone Achievements</h3>
          </div>
          <Badge variant="outline">{achievements.length} Unlocked</Badge>
        </div>

        {achievements.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {achievements.map((badge: any) => (
              <div
                key={badge.id}
                className="p-3.5 rounded-xl border border-border bg-card/60 flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                  <Award className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs">{badge.name}</h4>
                  <p className="text-[11px] text-muted-foreground leading-tight">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-muted-foreground border rounded-xl border-dashed">
            Complete your initial check-in or first lesson to unlock milestone badges!
          </div>
        )}
      </Card>

      {/* Edit Profile Modal Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-display">Edit Profile Details</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update your name, age group, target learning language, and daily commitment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Full Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your full name"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Age Group</Label>
                <Select value={editAgeGroup} onValueChange={setEditAgeGroup}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_12">Child (Under 12)</SelectItem>
                    <SelectItem value="student">Student / Youth</SelectItem>
                    <SelectItem value="pro">Working Professional</SelectItem>
                    <SelectItem value="senior">Senior Learner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Learner Role</Label>
                <Input
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  placeholder="e.g. Student, Engineer, Parent"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Target Learning Language</Label>
                <Select value={editLearningLang} onValueChange={setEditLearningLang}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="te">Telugu (తెలుగు)</SelectItem>
                    <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Website Interface Language</Label>
                <Select value={editWebsiteLang} onValueChange={setEditWebsiteLang}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="te">Telugu (తెలుగు)</SelectItem>
                    <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Primary Learning Goal</Label>
              <Input
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                placeholder="e.g. Everyday Speaking, Exam Prep, Career"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Daily Learning Target (Minutes/day)</Label>
              <Input
                type="number"
                value={editDailyGoal}
                onChange={(e) => setEditDailyGoal(Number(e.target.value))}
                min={5}
                max={120}
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="text-xs gap-1.5">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Profile Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
