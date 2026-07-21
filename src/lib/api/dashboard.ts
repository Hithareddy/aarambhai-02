/**
 * Dashboard API service.
 *
 * Assembles the dashboard snapshot from real FastAPI data: the authenticated
 * user (`/auth/me`), the learner profile (`/learners/me`) and completed
 * assessments (`/assessments/history`).
 *
 * The backend currently models auth + the adaptive assessment only. Metrics
 * that depend on a learning-content/gamification system that does not exist yet
 * (XP, streaks, lesson activity, notifications) are returned as honest
 * empty/zero values rather than fabricated numbers.
 */
import { getAssessmentHistory, SKILL_LABEL, type AssessmentResult, type Skill } from "./assessment";
import { getLearnerProfile } from "./learner";
import { apiRequest } from "./http";
import { getRecommendedLesson, getModule, getModules } from "./learning";
import type { DashboardSnapshot, NotificationItem, SkillMastery, TopicInsight } from "./types";

interface BackendUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function skillLabel(skill: string): string {
  return SKILL_LABEL[skill as Skill] ?? skill;
}

function toSkillMastery(latest: AssessmentResult | undefined): SkillMastery[] {
  if (!latest) return [];
  return latest.skillOutcomes.map((o) => ({
    skill: skillLabel(o.skill),
    percent: Math.round((o.score ?? 0) * 100),
    trend: "flat",
  }));
}

function toTopics(names: string[], latest: AssessmentResult | undefined): TopicInsight[] {
  const bySkill = new Map(latest?.skillOutcomes.map((o) => [o.skill, o.score ?? 0]) ?? []);
  return names.map((name) => ({
    topic: skillLabel(name),
    mastery: Math.round((bySkill.get(name as Skill) ?? 0) * 100),
    delta: 0,
  }));
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [user, profile, history, recommendedLessonNode, allModules] = await Promise.all([
    apiRequest<BackendUser>("/auth/me"),
    getLearnerProfile(),
    getAssessmentHistory().catch(() => [] as AssessmentResult[]),
    getRecommendedLesson().catch(() => null),
    getModules().catch(() => []),
  ]);

  const name = profile?.name || user.full_name;
  const latest = history[0];

  let continueLesson = null;

  // Real active lesson progression overrides the static assessment map
  if (recommendedLessonNode) {
    const recommendedModule = await getModule(recommendedLessonNode.module_id).catch(() => null);

    continueLesson = {
      id: recommendedLessonNode.id,
      courseId: recommendedLessonNode.module_id,
      courseTitle: recommendedModule?.title || "Active Module",
      chapter: `Core ${recommendedModule?.skill || "Focus"}`,
      lessonTitle: recommendedLessonNode.title,
      progress: 0,
      minutesLeft: recommendedModule?.estimated_duration || 15,
      gradientFrom: "hsl(var(--primary))",
      gradientTo: "hsl(var(--accent))"
    };
  } else if (latest?.recommendedLearningPath && Array.isArray(latest.recommendedLearningPath) && latest.recommendedLearningPath.length > 0) {
    // Fallback safely only if it's genuinely an array (handling migrated JSON string states gracefully)
    continueLesson = {
      id: "cont_1",
      courseId: latest.recommendedLearningPath[0].module_id || "course_1",
      courseTitle: latest.recommendedLearningPath[0].title || "Fundamentals",
      chapter: `Core ${latest.recommendedLearningPath[0].skill}`,
      lessonTitle: "Start Fundamentals",
      progress: 0,
      minutesLeft: 10,
      gradientFrom: "hsl(var(--primary))",
      gradientTo: "hsl(var(--accent))"
    };
  }

  // Derive "upcoming recommendations" from genuine Modules excluding the currently active one
  const upcomingModules = allModules.filter(m => m.id !== continueLesson?.courseId).slice(0, 3);


  return {
    profile: {
      id: user.id,
      name,
      initials: initialsOf(name),
      headline: profile?.learning_goal
        ? `Working towards: ${profile.learning_goal}`
        : "Let's continue your learning journey.",
      level: 1,
      xp: 0,
      xpForNextLevel: 100,
      languages: profile?.learning_language ? [profile.learning_language] : [],
      joinedAt: user.created_at,
    },
    goal: {
      targetMinutes: 15,
      completedMinutes: 0,
      streakDays: 0,
      longestStreak: 0,
      consistencyPercent: 0,
      learningHoursThisWeek: 0,
    },
    weeklyActivity: [],
    monthlyActivity: [],
    skills: toSkillMastery(latest),
    weakTopics: toTopics(latest?.improvements ?? [], latest),
    strongTopics: toTopics(latest?.strengths ?? [], latest),
    continueLesson: continueLesson,
    recommendations: upcomingModules.map((m, index) => ({
      id: m.id,
      category: m.skill,
      title: m.title,
      durationMinutes: m.estimated_duration,
      difficulty: ["Beginner", "Intermediate", "Advanced"][Math.min(m.difficulty - 1, 2)] as any,
      reason: "Next module in curriculum",
    })),
    recentlyCompleted: history.map((r) => ({
      id: r.sessionId,
      title: "Initial adaptive assessment",
      completedAt: r.completedAt,
      score: Math.round(r.confidenceScore * 100),
      courseTitle: "Assessment",
    })),
    upcomingAssessments: [],
    achievements: [],
    notifications: [],
    activityFeed: history.map((r) => ({
      id: r.sessionId,
      timestamp: r.completedAt,
      kind: "assessment",
      message: `Completed an adaptive assessment — level ${r.overallLevel}.`,
    })),
    courseCompletionPercent: 0,
  };
}

// No backend notification system exists yet; these keep the ApiClient contract
// without any mock data. They are no-ops because the notification list is empty.
export async function markNotificationRead(id: string): Promise<NotificationItem> {
  throw new Error(`Notification ${id} not found`);
}

export async function markAllNotificationsRead(): Promise<void> {
  return;
}
