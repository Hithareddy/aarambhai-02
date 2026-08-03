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
  reasonText?: string; // Sprint 10.1
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

export interface ActivitySyncPayload {
  activity_date: string; // YYYY-MM-DD
  assessment_seconds: number;
  lesson_seconds: number;
  game_seconds: number;
  ai_tutor_seconds: number;
  general_seconds: number;
}

export interface DailyActivityRecord {
  activity_date: string;
  total_active_seconds: number;
  assessment_seconds: number;
  lesson_seconds: number;
  game_seconds: number;
  ai_tutor_seconds: number;
  general_seconds: number;
  goal_minutes?: number;
  goal_eligible_seconds?: number;
  goal_completed?: boolean;
  bonus_learning_minutes?: number;
}

export interface CategoryBreakdown {
  category: "lessons" | "assessment" | "games" | "ai_tutor" | "general";
  label: string;
  seconds: number;
  minutes: number;
}

export interface ActivitySummary {
  period: "today" | "week" | "month";
  reference_date: string;
  total_active_seconds: number;
  total_active_minutes: number;
  assessment_seconds: number;
  lesson_seconds: number;
  game_seconds: number;
  ai_tutor_seconds: number;
  general_seconds: number;
  current_goal_minutes?: number;
  today_goal_eligible_seconds?: number;
  today_goal_completed?: boolean;
  today_bonus_learning_minutes?: number;
  active_days_count: number;
  categories: CategoryBreakdown[];
  daily_records: DailyActivityRecord[];
}

export interface MonthCalendarData {
  year: number;
  month: number;
  total_active_seconds: number;
  total_active_minutes: number;
  goal_completed_days_count: number;
  active_days_count: number;
  days_in_month: number;
  daily_records: DailyActivityRecord[];
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  today_completed: boolean;
  last_completed_date: string | null;
  is_new_learner: boolean;
}

export interface WordOfTheDay {
  id: string;
  word: string;
  phonetic?: string | null;
  language: string;
  meaning_en: string;
  meaning_support: string;
  support_language: string;
  example_sentence: string;
  assigned_date: string;
  is_completed: boolean;
  learner_sentence?: string | null;
}

export interface SentenceCheckResult {
  is_valid: boolean;
  feedback_message: string;
  is_completed: boolean;
  learned_word?: WordOfTheDay | null;
}

export interface LearnedWord {
  id: string;
  word: string;
  phonetic?: string | null;
  language: string;
  meaning_en: string;
  meaning_support: string;
  example_sentence: string;
  learner_sentence: string;
  learned_date: string;
}

export interface MyWordsData {
  total_count: number;
  words: LearnedWord[];
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

export interface TutorProfile {
  tutor_name: string;
  learner_name: string;
  learning_language: string;
  website_language: string;
  current_familiarity: string;
}

export interface TutorConversation {
  id: string;
  tutor_name: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface TutorMessage {
  id: string;
  conversation_id: string;
  role: "learner" | "tutor";
  content: string;
  created_at: string;
}

export interface ChatMessageResult {
  user_message: TutorMessage;
  tutor_reply: TutorMessage;
}

export interface VoiceChatResult {
  transcript: string;           // What the learner said (from STT)
  user_message: TutorMessage;
  tutor_reply: TutorMessage;
  tutor_audio_token: string;    // One-time token for /voice-audio/{token}
}

export interface ScreenContextPayload {
  page_type?: string;
  assessment_mode?: boolean;
  module_id?: string | null;
  module_title?: string | null;
  lesson_id?: string | null;
  lesson_title?: string | null;
  skill?: string | null;
  activity_id?: string | null;
  activity_type?: string | null;
  activity_title?: string | null;
  displayed_content?: string | null;
  question_id?: string | null;
  question_type?: string | null;
  difficulty?: number | null;
  learner_answer?: string | null;
  correct_answer?: string | null;
  answer_status?: string | null;
}
