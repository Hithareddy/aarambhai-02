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
