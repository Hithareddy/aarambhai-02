// Shared API contracts. These mirror what the FastAPI backend will expose;
// the mock client and the future HTTP client both implement `ApiClient` in
// `./client.ts`. UI code should ONLY import types from here.

export type ISODateString = string;

export interface LearnerProfile {
  id: string;
  name: string;
  initials: string;
  headline: string;
  level: number;
  xp: number;
  xpForNextLevel: number;
  languages: string[];
  joinedAt: ISODateString;
}

export interface DailyGoal {
  targetMinutes: number;
  completedMinutes: number;
  streakDays: number;
  longestStreak: number;
  consistencyPercent: number;
  learningHoursThisWeek: number;
}

export interface ActivityDay {
  date: ISODateString; // yyyy-mm-dd
  minutes: number;
  xp: number;
  lessonsCompleted: number;
}

export interface SkillMastery {
  skill: string;
  percent: number;
  trend: "up" | "flat" | "down";
}

export interface TopicInsight {
  topic: string;
  mastery: number;
  delta: number; // percent points change last 7d
}

export interface ContinueLesson {
  id: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  chapter: string;
  progress: number; // 0-100
  minutesLeft: number;
  gradientFrom: string; // css color
  gradientTo: string;
}

export interface RecommendedLesson {
  id: string;
  title: string;
  reason: string;
  category: string;
  durationMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

export interface CompletedLesson {
  id: string;
  title: string;
  completedAt: ISODateString;
  score: number; // 0-100
  courseTitle: string;
}

export interface UpcomingAssessment {
  id: string;
  title: string;
  scheduledFor: ISODateString;
  durationMinutes: number;
  type: "adaptive" | "practice" | "milestone";
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: "flame" | "trophy" | "sparkles" | "target" | "medal" | "star";
  earnedAt?: ISODateString;
  progress?: number;
  target?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  createdAt: ISODateString;
  read: boolean;
  type: "reminder" | "achievement" | "assessment" | "community" | "system";
}

export interface ActivityEvent {
  id: string;
  timestamp: ISODateString;
  kind: "lesson" | "assessment" | "streak" | "badge" | "practice";
  message: string;
}

export interface AssessmentOption {
  id: string;
  label: string;
}

export interface AssessmentQuestion {
  id: string;
  prompt: string;
  skill: string;
  options: AssessmentOption[];
  correctOptionId: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentAnswer {
  questionId: string;
  optionId: string;
}

export interface AssessmentSkillScore {
  skill: string;
  correct: number;
  total: number;
  percent: number;
}

export interface AssessmentResult {
  assessmentId: string;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  skillBreakdown: AssessmentSkillScore[];
  recommendation: string;
  completedAt: ISODateString;
}

export interface DashboardSnapshot {
  profile: LearnerProfile;
  goal: DailyGoal;
  weeklyActivity: ActivityDay[]; // last 7 days, oldest first
  monthlyActivity: ActivityDay[]; // last 28 days, oldest first
  skills: SkillMastery[];
  weakTopics: TopicInsight[];
  strongTopics: TopicInsight[];
  continueLesson: ContinueLesson | null;
  recommendations: RecommendedLesson[];
  recentlyCompleted: CompletedLesson[];
  upcomingAssessments: UpcomingAssessment[];
  achievements: AchievementBadge[];
  notifications: NotificationItem[];
  activityFeed: ActivityEvent[];
  courseCompletionPercent: number;
}
