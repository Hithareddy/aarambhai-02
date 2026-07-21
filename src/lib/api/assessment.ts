/**
 * Assessment API service.
 *
 * Talks directly to the FastAPI backend Assessment Engine. All questions are
 * multiple-choice: each question exposes a list of options ({ id, text }) and
 * the learner submits the id of the chosen option.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/** Number of questions in the default placement blueprint (backend default). */
export const TOTAL_QUESTIONS = 8;

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

export interface Question {
  id: string;
  skill: Skill;
  difficulty: number;
  prompt: string;
  options: QuestionOption[];
  isFallback?: boolean;
}

export interface AssessmentSession {
  id: string;
  status: string;
  currentIndex: number;
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
  recommendedFocus: string;
  recommendedLearningPath: string[];
  totalQuestions: number;
}

// --- Backend response shapes -------------------------------------------------

interface BackendSession {
  id: string;
  status: string;
  current_question_index: number;
}

interface BackendQuestion {
  id: string;
  skill: string;
  difficulty: number;
  language: string;
  question_content: { text?: string } | string;
  options: Array<{ id: string; text: string }> | string;
  is_fallback?: boolean;
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
  learning_path: { recommended_start?: string; path?: string[] };
  created_at: string;
}

// --- HTTP helper -------------------------------------------------------------

async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
): Promise<T> {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: `API error: ${response.status}` }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
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
    prompt: content.text ?? "",
    options: options.map((o) => ({ id: o.id, text: o.text })),
    isFallback: data.is_fallback,
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
    recommendedFocus: data.learning_path?.recommended_start ?? proficiencies[0]?.skill ?? "general",
    recommendedLearningPath: data.learning_path?.path ?? proficiencies.map((p) => p.skill),
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
  optionId: string,
  responseTimeSeconds: number,
): Promise<void> {
  await apiRequest(`/assessments/sessions/${sessionId}/responses`, "POST", {
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
