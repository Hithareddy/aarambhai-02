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
import { getRecommendedLesson, getModule, getModules, getSkillProfiles } from "./learning";
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

function toSkillMastery(latest: AssessmentResult | undefined, profiles: any[]): SkillMastery[] {
  // If we have actual continuous SkillProfile data, trust that entirely.
  if (profiles && profiles.length > 0) {
    return profiles.map(p => ({
      skill: skillLabel(p.skill),
      percent: Math.round(p.mastery_percentage),
      trend: "up" // Simplified trend for Sprint 10
    }));
  }

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
  const [user, profile, history, recommendedLessonNode, allModules, skillProfiles, gamification, weekActivity, monthActivity, streakData, earnedAchievements] = await Promise.all([
    apiRequest<BackendUser>("/auth/me"),
    getLearnerProfile().catch(() => null),
    getAssessmentHistory().catch(() => [] as AssessmentResult[]),
    getRecommendedLesson().catch(() => null),
    getModules().catch(() => []),
    getSkillProfiles().catch(() => []),
    apiRequest<any>("/users/me/gamification").catch(() => null),
    apiRequest<any>("/activity/summary?period=week").catch(() => null),
    apiRequest<any>("/activity/summary?period=month").catch(() => null),
    apiRequest<any>("/activity/streak").catch(() => null),
    apiRequest<any[]>("/users/me/achievements").catch(() => []),
  ]);

  const name = profile?.name || user.full_name;
  const latest = history[0];

  let continueLesson = null;

  // Real active lesson progression overrides the static assessment map
  if (recommendedLessonNode && recommendedLessonNode.lesson) {
    const lessonData = recommendedLessonNode.lesson;
    const recommendedModule = await getModule(lessonData.module_id).catch(() => null);

    continueLesson = {
      id: lessonData.id,
      courseId: lessonData.module_id,
      courseTitle: recommendedModule?.title || "Active Module",
      chapter: `Core ${recommendedModule?.skill || "Focus"}`,
      lessonTitle: lessonData.title,
      progress: 0,
      minutesLeft: recommendedModule?.estimated_duration || 15,
      gradientFrom: "hsl(var(--primary))",
      gradientTo: "hsl(var(--accent))",
      reasonText: recommendedLessonNode.reason?.message
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

  // Map real weekly and monthly activity records
  const weeklyActivityList = weekActivity?.daily_records
    ? weekActivity.daily_records.map((r: any) => ({
        date: r.activity_date,
        minutes: Math.round(r.total_active_seconds / 60),
        xp: 0,
        lessonsCompleted: 0,
      }))
    : [];

  const monthlyActivityList = monthActivity?.daily_records
    ? monthActivity.daily_records.map((r: any) => ({
        date: r.activity_date,
        minutes: Math.round(r.total_active_seconds / 60),
        xp: 0,
        lessonsCompleted: 0,
      }))
    : [];

  const todayRecord = weekActivity?.daily_records?.slice(-1)[0];
  const todayMinutes = todayRecord ? Math.round(todayRecord.total_active_seconds / 60) : 0;
  const learningHoursThisWeek = weekActivity ? Math.round((weekActivity.total_active_seconds / 3600) * 10) / 10 : 0;

  return {
    profile: {
      id: user.id,
      name,
      initials: initialsOf(name),
      headline: profile?.learning_goal
        ? `Working towards: ${profile.learning_goal}`
        : "Let's continue your learning journey.",
      level: gamification?.level || 1,
      xp: gamification?.xp || 0,
      xpForNextLevel: (gamification?.level || 1) * 100, // naive progression
      languages: profile?.learning_language ? [profile.learning_language] : [],
      joinedAt: user.created_at,
    },
    goal: {
      targetMinutes: profile?.daily_goal_minutes || 20,
      completedMinutes: todayMinutes,
      streakDays: streakData?.current_streak ?? gamification?.streak_days ?? (weekActivity?.active_days_count > 0 ? 1 : 0),
      longestStreak: streakData?.longest_streak ?? gamification?.longest_streak ?? 1,
      consistencyPercent: weekActivity ? Math.round((weekActivity.active_days_count / 7) * 100) : 0,
      learningHoursThisWeek,
    },
    weeklyActivity: weeklyActivityList,
    monthlyActivity: monthlyActivityList,
    skills: toSkillMastery(latest, skillProfiles),
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
    achievements: (earnedAchievements || []).map((b: any) => ({
      id: b.id,
      title: b.name,
      description: b.description,
      unlockedAt: b.earned_at || new Date().toISOString(),
      icon: "trophy"
    })),
    notifications: [],
    activityFeed: [
      ...(recommendedLessonNode && recommendedLessonNode.reason ? [{
        id: `rec_${recommendedLessonNode.lesson.id}`,
        timestamp: new Date().toISOString(),
        kind: "lesson" as const,
        message: `Adaptive Engine mapped '${recommendedLessonNode.lesson.title}': ${recommendedLessonNode.reason.message}`,
      }] : []),
      ...history.map((r) => ({
        id: r.sessionId,
        timestamp: r.completedAt,
        kind: "assessment" as const,
        message: `Completed an adaptive assessment — level ${r.overallLevel}.`,
      }))
    ],
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
