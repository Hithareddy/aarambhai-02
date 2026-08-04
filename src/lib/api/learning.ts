import { apiRequest } from "./http";

export interface ContentBlock {
    id: string;
    type: string; // text, image, audio, vocabulary, practice, recap, conversation
    content: Record<string, any>;
    order: number;
}

export interface LearningModule {
    id: string;
    title: string;
    description: string;
    skill: string;
    difficulty: number;
    estimated_duration: number;
    prerequisites: string[];
    order: number;
}

export interface Lesson {
    id: string;
    module_id: string;
    title: string;
    lesson_type: string;
    schema_version: string;
    content_blocks: ContentBlock[];
    completion_criteria: Record<string, any>;
    order: number;
}

export interface LessonProgressUpdate {
    status?: "not_started" | "in_progress" | "completed";
    progress_percentage?: number;
    score?: number;
    time_spent_seconds?: number;
    completed_at?: string;
    quiz_accuracy?: number;
    pronunciation_score?: number;
    hints_used?: number;
}

export interface RecommendationReason {
    type: "resume" | "reinforcement" | "revision" | "next_in_sequence" | "fallback";
    skill: string;
    message: string;
}

export interface RecommendedLessonResponse {
    lesson: Lesson;
    reason: RecommendationReason;
}

export interface SkillProfile {
    skill: string;
    current_level: number;
    mastery_percentage: number;
    confidence_score: number;
}

/**
 * API Wrapper Calls 
 */

export async function getModules(): Promise<LearningModule[]> {
    return apiRequest<LearningModule[]>("/learning/modules");
}

export async function getModule(id: string): Promise<LearningModule & { lessons: Lesson[] }> {
    return apiRequest<LearningModule & { lessons: Lesson[] }>(`/learning/modules/${id}`);
}

export async function getLesson(id: string): Promise<Lesson> {
    return apiRequest<Lesson>(`/learning/lessons/${id}`);
}

export async function getRecommendedLesson(): Promise<RecommendedLessonResponse> {
    return apiRequest<RecommendedLessonResponse>("/learning/recommended");
}

export async function getSkillProfiles(): Promise<SkillProfile[]> {
    return apiRequest<SkillProfile[]>("/learning/profiles");
}

export async function saveLessonProgress(lessonId: string, update: LessonProgressUpdate): Promise<void> {
    await apiRequest(`/learning/progress/${lessonId}`, "POST", update);
}

/**
 * Learning Journey (milestone roadmap)
 */

export type MilestoneState = "completed" | "current" | "available" | "locked";

export interface JourneyLesson {
    id: string;
    title: string;
    lesson_type: string;
    order: number;
    status: "not_started" | "in_progress" | "completed";
    progress_percentage: number;
    score: number | null;
    xp_reward: number;
}

export interface JourneyMilestone {
    id: string;
    title: string;
    description: string;
    skill: string;
    difficulty: number;
    estimated_duration: number;
    order: number;
    state: MilestoneState;
    progress_percentage: number;
    completed_lessons: number;
    total_lessons: number;
    xp_total: number;
    xp_earned: number;
    prerequisites: string[];
    unmet_prerequisites: string[];
    recommendation_reason: string | null;
    priority: number | null;
    lessons: JourneyLesson[];
    next_lesson_id: string | null;
}

export interface JourneyRecommendation {
    type: "next_step" | "reinforce" | "celebrate" | "tutor" | string;
    title: string;
    message: string;
    action: "lesson" | "practice" | "games" | "tutor" | string;
    target: string;
}

export interface LearningJourney {
    has_path: boolean;
    learner_name: string | null;
    learning_goal: string | null;
    learning_language: string | null;
    overall_percentage: number;
    total_lessons: number;
    completed_lessons: number;
    modules_completed: number;
    modules_total: number;
    xp_earned: number;
    xp_available: number;
    estimated_minutes_remaining: number;
    estimated_days_remaining: number;
    daily_goal_minutes: number;
    current_module_id: string | null;
    next_lesson_id: string | null;
    skill_profiles: SkillProfile[];
    recommendations: JourneyRecommendation[];
    milestones: JourneyMilestone[];
}

export async function getLearningJourney(): Promise<LearningJourney> {
    return apiRequest<LearningJourney>("/learning/journey");
}
