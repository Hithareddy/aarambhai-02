// In-memory implementation of `ApiClient`. Data is deterministic per session
// so the UI feels alive without any backend. Replace with an HttpApiClient
// implementing the same interface when FastAPI endpoints exist.

import type {
  ActivityDay,
  Assessment,
  AssessmentAnswer,
  AssessmentResult,
  AssessmentSkillScore,
  DashboardSnapshot,
  NotificationItem,
} from "./types";
import type { ApiClient } from "./client";

type Api = ApiClient;

const NETWORK_DELAY_MS = 220;

function delay<T>(value: T, ms = NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isoNowOffset(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

// Deterministic pseudo-random so charts look natural but stable per session.
function seededSeries(seed: number, days: number, base: number, spread: number): number[] {
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < days; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    out.push(Math.round(base + r * spread));
  }
  return out;
}

const weekMinutes = [12, 18, 8, 24, 32, 0, 16];
const weekXP = [80, 120, 40, 210, 260, 0, 140];
const weekLessons = [1, 2, 1, 3, 3, 0, 2];

const weeklyActivity: ActivityDay[] = weekMinutes.map((m, i) => ({
  date: daysAgoISO(6 - i),
  minutes: m,
  xp: weekXP[i],
  lessonsCompleted: weekLessons[i],
}));

const monthlyMinutes = seededSeries(42, 28, 4, 26);
const monthlyActivity: ActivityDay[] = monthlyMinutes.map((m, i) => ({
  date: daysAgoISO(27 - i),
  minutes: m,
  xp: m * 8,
  lessonsCompleted: Math.round(m / 10),
}));

let notifications: NotificationItem[] = [
  {
    id: "n_1",
    title: "Chapter unlocked",
    description: "‘Small talk basics’ is now available on your path.",
    createdAt: isoNowOffset(2),
    read: false,
    type: "reminder",
  },
  {
    id: "n_2",
    title: "New badge in reach",
    description: "One more day of practice earns you the ‘Steady Learner’ badge.",
    createdAt: isoNowOffset(8),
    read: false,
    type: "achievement",
  },
  {
    id: "n_3",
    title: "Weekly check-in",
    description: "Take a 5-minute assessment to fine-tune your path.",
    createdAt: isoNowOffset(26),
    read: true,
    type: "assessment",
  },
];

const dashboard: DashboardSnapshot = {
  profile: {
    id: "u_1",
    name: "Ananya Arora",
    initials: "AA",
    headline: "Everyday English • Beginner",
    level: 4,
    xp: 1240,
    xpForNextLevel: 1500,
    languages: ["English", "Hindi"],
    joinedAt: daysAgoISO(46),
  },
  goal: {
    targetMinutes: 20,
    completedMinutes: 12,
    streakDays: 4,
    longestStreak: 9,
    consistencyPercent: 72,
    learningHoursThisWeek: 1.8,
  },
  weeklyActivity,
  monthlyActivity,
  skills: [
    { skill: "Listening", percent: 72, trend: "up" },
    { skill: "Speaking", percent: 54, trend: "up" },
    { skill: "Reading", percent: 81, trend: "flat" },
    { skill: "Writing", percent: 40, trend: "down" },
  ],
  weakTopics: [
    { topic: "Past tense verbs", mastery: 38, delta: -4 },
    { topic: "Prepositions of place", mastery: 44, delta: -1 },
    { topic: "Formal vs informal tone", mastery: 47, delta: 2 },
  ],
  strongTopics: [
    { topic: "Greetings & introductions", mastery: 92, delta: 3 },
    { topic: "Numbers 1–100", mastery: 88, delta: 5 },
    { topic: "Ordering food", mastery: 84, delta: 2 },
  ],
  continueLesson: {
    id: "l_23",
    courseId: "c_english_everyday",
    courseTitle: "Everyday English",
    lessonTitle: "Ordering food at a café",
    chapter: "Chapter 3 · Lesson 2",
    progress: 45,
    minutesLeft: 6,
    gradientFrom: "var(--primary)",
    gradientTo: "var(--secondary)",
  },
  recommendations: [
    {
      id: "r_1",
      title: "Voice reading practice",
      reason: "Boosts speaking confidence — your current growth area.",
      category: "Speaking",
      durationMinutes: 6,
      difficulty: "Beginner",
    },
    {
      id: "r_2",
      title: "Numbers 1–100 quick check",
      reason: "You’re close to mastering this — one review locks it in.",
      category: "Vocabulary",
      durationMinutes: 4,
      difficulty: "Beginner",
    },
    {
      id: "r_3",
      title: "Everyday conversations",
      reason: "Applies everything from the past three chapters.",
      category: "Speaking",
      durationMinutes: 12,
      difficulty: "Intermediate",
    },
  ],
  recentlyCompleted: [
    {
      id: "cl_1",
      title: "Greetings & introductions",
      courseTitle: "Everyday English",
      completedAt: isoNowOffset(28),
      score: 96,
    },
    {
      id: "cl_2",
      title: "Numbers & counting",
      courseTitle: "Everyday English",
      completedAt: isoNowOffset(52),
      score: 88,
    },
    {
      id: "cl_3",
      title: "Digital basics: keyboards",
      courseTitle: "Digital basics",
      completedAt: isoNowOffset(96),
      score: 82,
    },
  ],
  upcomingAssessments: [
    {
      id: "a_1",
      title: "Chapter 3 check-in",
      scheduledFor: isoNowOffset(-24),
      durationMinutes: 8,
      type: "milestone",
    },
    {
      id: "a_2",
      title: "Weekly adaptive review",
      scheduledFor: isoNowOffset(-72),
      durationMinutes: 12,
      type: "adaptive",
    },
  ],
  achievements: [
    {
      id: "b_1",
      title: "First step",
      description: "Completed your first lesson.",
      icon: "sparkles",
      earnedAt: daysAgoISO(40),
    },
    {
      id: "b_2",
      title: "Warm-up week",
      description: "Practiced 5 days in a row.",
      icon: "flame",
      earnedAt: daysAgoISO(12),
    },
    {
      id: "b_3",
      title: "Steady Learner",
      description: "Reach a 7-day streak.",
      icon: "trophy",
      progress: 4,
      target: 7,
    },
  ],
  notifications,
  activityFeed: [
    { id: "f_1", timestamp: isoNowOffset(2), kind: "lesson", message: "Started ‘Ordering food at a café’." },
    { id: "f_2", timestamp: isoNowOffset(28), kind: "lesson", message: "Completed ‘Greetings & introductions’ with 96%." },
    { id: "f_3", timestamp: isoNowOffset(30), kind: "streak", message: "Extended your streak to 4 days." },
    { id: "f_4", timestamp: isoNowOffset(52), kind: "assessment", message: "Practice check: 8 of 10 correct." },
    { id: "f_5", timestamp: isoNowOffset(96), kind: "badge", message: "Earned the ‘Warm-up week’ badge." },
  ],
  courseCompletionPercent: 28,
};

const initialAssessment: Assessment = {
  id: "initial-adaptive",
  title: "Initial adaptive check-in",
  description: "A few friendly questions to help us find where to begin.",
  questions: [
    {
      id: "q_1",
      skill: "Reading",
      prompt: "Which word means the opposite of “begin”?",
      options: [
        { id: "q1_a", label: "Start" },
        { id: "q1_b", label: "End" },
        { id: "q1_c", label: "Open" },
        { id: "q1_d", label: "Continue" },
      ],
      correctOptionId: "q1_b",
    },
    {
      id: "q_2",
      skill: "Grammar",
      prompt: "Choose the correct sentence.",
      options: [
        { id: "q2_a", label: "She go to school every day." },
        { id: "q2_b", label: "She goes to school every day." },
        { id: "q2_c", label: "She going to school every day." },
        { id: "q2_d", label: "She gone to school every day." },
      ],
      correctOptionId: "q2_b",
    },
    {
      id: "q_3",
      skill: "Vocabulary",
      prompt: "A person who teaches students is called a…",
      options: [
        { id: "q3_a", label: "Doctor" },
        { id: "q3_b", label: "Teacher" },
        { id: "q3_c", label: "Driver" },
        { id: "q3_d", label: "Farmer" },
      ],
      correctOptionId: "q3_b",
    },
    {
      id: "q_4",
      skill: "Grammar",
      prompt: "Fill in the blank: “There ___ three books on the table.”",
      options: [
        { id: "q4_a", label: "is" },
        { id: "q4_b", label: "am" },
        { id: "q4_c", label: "are" },
        { id: "q4_d", label: "be" },
      ],
      correctOptionId: "q4_c",
    },
    {
      id: "q_5",
      skill: "Reading",
      prompt: "Read: “Ravi woke up early and watered the plants.” What did Ravi do first?",
      options: [
        { id: "q5_a", label: "Watered the plants" },
        { id: "q5_b", label: "Woke up early" },
        { id: "q5_c", label: "Went to school" },
        { id: "q5_d", label: "Cooked breakfast" },
      ],
      correctOptionId: "q5_b",
    },
  ],
};

function buildRecommendation(scorePercent: number): string {
  if (scorePercent >= 80) {
    return "Wonderful start! We'll begin with intermediate lessons to keep you challenged.";
  }
  if (scorePercent >= 50) {
    return "Nice work — we'll set up a balanced path that builds on what you already know.";
  }
  return "Great first step. We'll start with the gentle basics and grow from there.";
}

export const mockApiClient: Api = {
  async getAssessment(id) {
    if (id !== initialAssessment.id) {
      throw new Error(`Assessment ${id} not found`);
    }
    // Clone so components can't mutate the source data.
    return delay({
      ...initialAssessment,
      questions: initialAssessment.questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({ ...o })),
      })),
    });
  },

  async submitAssessment(id: string, answers: AssessmentAnswer[]): Promise<AssessmentResult> {
    if (id !== initialAssessment.id) {
      throw new Error(`Assessment ${id} not found`);
    }
    const answerByQuestion = new Map(answers.map((a) => [a.questionId, a.optionId]));
    const bySkill = new Map<string, { correct: number; total: number }>();
    let correctCount = 0;

    for (const question of initialAssessment.questions) {
      const isCorrect = answerByQuestion.get(question.id) === question.correctOptionId;
      if (isCorrect) correctCount += 1;
      const bucket = bySkill.get(question.skill) ?? { correct: 0, total: 0 };
      bucket.total += 1;
      if (isCorrect) bucket.correct += 1;
      bySkill.set(question.skill, bucket);
    }

    const totalQuestions = initialAssessment.questions.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const skillBreakdown: AssessmentSkillScore[] = [...bySkill.entries()].map(
      ([skill, { correct, total }]) => ({
        skill,
        correct,
        total,
        percent: Math.round((correct / total) * 100),
      }),
    );

    return delay({
      assessmentId: id,
      totalQuestions,
      correctCount,
      scorePercent,
      skillBreakdown,
      recommendation: buildRecommendation(scorePercent),
      completedAt: new Date().toISOString(),
    });
  },

  async getDashboardSnapshot() {
    // Return a fresh reference so React Query treats mutations correctly.
    return delay({ ...dashboard, notifications: [...notifications] });
  },

  async markNotificationRead(id) {
    notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    const found = notifications.find((n) => n.id === id);
    if (!found) throw new Error(`Notification ${id} not found`);
    return delay(found, 120);
  },

  async markAllNotificationsRead() {
    notifications = notifications.map((n) => ({ ...n, read: true }));
    return delay(undefined, 120);
  },
};
