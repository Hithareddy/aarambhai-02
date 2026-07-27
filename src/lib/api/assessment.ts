/**
 * Assessment API service.
 *
 * Talks directly to the FastAPI backend Assessment Engine. Questions are
 * typed via `question_type`; each exposes a list of options ({ id, text })
 * and the learner submits the id of the chosen option.
 *
 * Supported question_type values (from backend seed):
 *   mcq | true_false | fill_blank | match | arrange | comprehension | image_mcq
 */

import { apiRequest, API_BASE } from "./http";

/** Number of questions in the default placement blueprint (backend default). */
export const TOTAL_QUESTIONS = 15;

export type Skill =
  | "listening"
  | "speaking"
  | "reading"
  | "writing"
  | "vocabulary"
  | "grammar"
  | "pronunciation"
  | "conversations";

export type SkillLevel = "Beginner" | "Elementary" | "Intermediate" | "Advanced";

export interface LearnerProfile {
  ageGroup: string;
  educationLevel: string;
  language: string;
  learningGoal: string;
  selfProficiency: SkillLevel;
}

export const DEFAULT_PROFILE: LearnerProfile = {
  ageGroup: "25-34",
  educationLevel: "High School",
  language: "English",
  learningGoal: "Improve everyday conversation",
  selfProficiency: "Beginner",
};

export const SKILL_LABEL: Record<Skill, string> = {
  listening: "Listening",
  speaking: "Speaking",
  reading: "Reading",
  writing: "Writing",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  pronunciation: "Pronunciation",
  conversations: "Conversations",
};

export const SKILL_ICON: Record<Skill, string> = {
  listening: "🎧",
  speaking: "🎤",
  reading: "📖",
  writing: "✍️",
  vocabulary: "📚",
  grammar: "🔤",
  pronunciation: "🗣️",
  conversations: "💬",
};

export const SKILLS: Skill[] = [
  "listening",
  "speaking",
  "reading",
  "writing",
  "vocabulary",
  "grammar",
  "pronunciation",
  "conversations",
];

export interface QuestionOption {
  id: string;
  text: string;
}

export type QuestionType =
  | "mcq"
  | "true_false"
  | "fill_blank"
  | "match"
  | "arrange"
  | "comprehension"
  | "image_mcq"
  | string; // allow future types without breaking the type system

export interface Question {
  id: string;
  skill: Skill;
  difficulty: number;
  question_type: QuestionType;
  prompt: string;
  options: QuestionOption[];
  isFallback?: boolean;
  audio_url?: string | null;
  audio_script?: string | null;
  image_url?: string | null;
  reference_text?: string | null;
  max_duration_seconds?: number;
}

export interface AssessmentSession {
  id: string;
  status: string;
  currentIndex: number;
  totalQuestions: number;
}

export interface SkillOutcome {
  skill: Skill;
  level: SkillLevel;
  score: number | null;
  asked: number;
}

export interface AssessmentResult {
  sessionId: string;
  completedAt: string;
  overallLevel: SkillLevel;
  confidenceScore: number;
  readinessLevel: string;
  skillOutcomes: SkillOutcome[];
  strengths: string[];
  improvements: string[];
  learningSummary: string | null;
  recommendedFocus: string;
  recommendedLearningPath: { module_id: string; title: string; skill: string; priority: number }[];
  totalQuestions: number;
}

// --- Backend response shapes -------------------------------------------------

interface BackendSession {
  id: string;
  status: string;
  current_question_index: number;
  total_questions?: number;
}

interface BackendQuestion {
  id: string;
  skill: string;
  difficulty: number;
  question_type: string;
  language: string;
  question_content: { text?: string } | string;
  options: Array<{ id: string; text: string }> | string;
  is_fallback?: boolean;
  audio_url?: string | null;
  audio_script?: string | null;
  image_url?: string | null;
  reference_text?: string | null;
  max_duration_seconds?: number;
}

interface BackendSkillProficiency {
  skill: string;
  proficiency: number;
  questions_asked: number;
}

interface BackendResult {
  session_id: string;
  overall_proficiency: string;
  confidence_score: number;
  readiness_level: string;
  skill_proficiencies: BackendSkillProficiency[];
  strengths: string[];
  weaknesses: string[];
  learning_summary?: string;
  learning_path: { module_id: string; title: string; skill: string; priority: number }[];
  assessment_version?: string;
  created_at: string;
}


// --- Mappers -----------------------------------------------------------------

function parseJson<T>(value: T | string): T {
  return typeof value === "string" ? (JSON.parse(value) as T) : value;
}

function levelFromScore(score: number): SkillLevel {
  if (score >= 0.8) return "Advanced";
  if (score >= 0.6) return "Intermediate";
  if (score >= 0.3) return "Elementary";
  return "Beginner";
}

function mapQuestion(data: BackendQuestion): Question {
  const content = parseJson(data.question_content);
  const options = parseJson(data.options);
  return {
    id: data.id,
    skill: data.skill as Skill,
    difficulty: data.difficulty,
    question_type: data.question_type ?? "mcq",
    prompt: content.text ?? "",
    options: options.map((o) => ({ id: o.id, text: o.text })),
    isFallback: data.is_fallback,
    audio_url: data.audio_url,
    audio_script: data.audio_script,
    image_url: data.image_url,
    reference_text: data.reference_text,
    max_duration_seconds: data.max_duration_seconds,
  };
}

function mapResult(data: BackendResult): AssessmentResult {
  const proficiencies = data.skill_proficiencies ?? [];
  return {
    sessionId: data.session_id,
    completedAt: data.created_at,
    overallLevel: (data.overall_proficiency as SkillLevel) ?? "Beginner",
    confidenceScore: data.confidence_score,
    readinessLevel: data.readiness_level,
    skillOutcomes: proficiencies.map((p) => ({
      skill: p.skill as Skill,
      level: levelFromScore(p.proficiency),
      score: p.proficiency,
      asked: p.questions_asked,
    })),
    strengths: data.strengths ?? [],
    improvements: data.weaknesses ?? [],
    learningSummary: data.learning_summary || null,
    // Replace the old mock behavior to extract from data-driven path
    recommendedFocus: data.learning_path && data.learning_path.length > 0 ? data.learning_path[0].skill : (proficiencies[0]?.skill ?? "general"),
    recommendedLearningPath: data.learning_path || [],
    totalQuestions: proficiencies.reduce((sum, p) => sum + p.questions_asked, 0),
  };
}

// --- API functions -----------------------------------------------------------

export async function startAssessmentSession(): Promise<AssessmentSession> {
  const data = await apiRequest<BackendSession>("/assessments/sessions", "POST", {});
  return {
    id: data.id,
    status: data.status,
    currentIndex: data.current_question_index ?? 0,
    totalQuestions: data.total_questions ?? 15,
  };
}

/**
 * Fetch the next question for a session. Returns null when the assessment has
 * no more questions (the learner should be routed to completion). Any other
 * failure is re-thrown.
 */
export async function getNextQuestion(sessionId: string): Promise<Question | null> {
  try {
    const data = await apiRequest<BackendQuestion>(
      `/assessments/sessions/${sessionId}/next-question`,
    );
    return mapQuestion(data);
  } catch (err) {
    const message = (err as Error).message?.toLowerCase() ?? "";
    if (message.includes("no more questions") || message.includes("no questions")) {
      return null;
    }
    throw err;
  }
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  optionId: string | string[],
  responseTimeSeconds: number,
): Promise<{ is_correct: boolean; correct_answer?: any }> {
  return await apiRequest(`/assessments/sessions/${sessionId}/responses`, "POST", {
    question_id: questionId,
    selected_answer: optionId,
    response_time_seconds: responseTimeSeconds,
  });
}

export async function completeAssessment(sessionId: string): Promise<AssessmentResult> {
  const data = await apiRequest<BackendResult>(
    `/assessments/sessions/${sessionId}/complete`,
    "POST",
  );
  return mapResult(data);
}

export async function getAssessmentResult(sessionId: string): Promise<AssessmentResult> {
  const data = await apiRequest<BackendResult>(`/assessments/sessions/${sessionId}/result`);
  return mapResult(data);
}

export async function getAssessmentHistory(): Promise<AssessmentResult[]> {
  const data = await apiRequest<BackendResult[]>("/assessments/history");
  return data.map(mapResult);
}

export function abandonSession(): void {
  localStorage.removeItem("assessment_session_id");
}

// --- Speaking Assessment -----------------------------------------------------

/**
 * Uploads a recorded audio blob to the speech evaluation endpoint.
 */
export async function evaluateSpeech(
  sessionId: string,
  questionId: string,
  audioBlob: Blob,
): Promise<{ accepted: boolean }> {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const formData = new FormData();
  formData.append("question_id", questionId);
  formData.append("audio_file", audioBlob, "recording.webm");
  // Defaulting to Indian English layout as per PRD
  formData.append("language_code", "en-IN");

  const response = await fetch(`${API_BASE}/assessments/sessions/${sessionId}/evaluate-speech`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `API error: ${response.status}` }));
    throw new Error(error.detail || `Speech Evaluation failed: ${response.status}`);
  }

  return response.json();
}
