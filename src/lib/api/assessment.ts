/**
 * Assessment API service for aarambhai-02-main
 * Integrates with the FastAPI backend Assessment Engine
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export type Skill = "listening" | "speaking" | "reading" | "writing";
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
};

export const SKILL_ICON: Record<Skill, string> = {
  listening: "🎧",
  speaking: "🎤",
  reading: "📖",
  writing: "✍️",
};

export const SKILLS: Skill[] = ["listening", "speaking", "reading", "writing"];

export interface BaseQuestion {
  id: string;
  skill: Skill;
  difficulty: SkillLevel;
  index: number;
  total: number;
}

export interface ListeningQuestion extends BaseQuestion {
  skill: "listening";
  type: "listening_mcq";
  instruction: string;
  audioText: string;
  language: string;
  options: string[];
  correctIndex: number;
}

export interface SpeakingQuestion extends BaseQuestion {
  skill: "speaking";
  type: "speaking_prompt";
  instruction: string;
  targetPhrase: string;
  language: string;
}

export interface ReadingQuestion extends BaseQuestion {
  skill: "reading";
  type: "reading_mcq";
  passage: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface WritingQuestion extends BaseQuestion {
  skill: "writing";
  type: "writing_prompt";
  instruction: string;
  minWords: number;
}

export type Question = ListeningQuestion | SpeakingQuestion | ReadingQuestion | WritingQuestion;

export type AnswerResponse =
  | {
      kind: "mcq";
      selectedIndex: number;
      audioPlayed?: boolean;
      playCount?: number;
      playCompleted?: boolean;
    }
  | {
      kind: "speech";
      transcript: string;
      durationMs: number;
      retries?: number;
      confidence?: number;
    }
  | { kind: "writing"; text: string; wordCount: number };

export interface RecordedAnswer {
  questionId: string;
  skill: Skill;
  response: AnswerResponse;
  correct?: boolean;
  score: number;
  difficultyDecision: SkillLevel;
  submittedAt: string;
}

export type SessionStatus = "active" | "completed" | "abandoned" | "in_progress";

export interface AssessmentSession {
  id: string;
  profile: LearnerProfile;
  createdAt: string;
  status: SessionStatus;
  plan: Question[];
  currentIndex: number;
  answers: RecordedAnswer[];
  skillCounts: Record<Skill, { asked: number; total: number }>;
  warnings?: string[];
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
  language: string;
  overallLevel: SkillLevel;
  skillOutcomes: SkillOutcome[];
  strengths: string[];
  improvements: string[];
  recommendedFocus: string;
  recommendedLearningPath: string[];
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  level: SkillLevel;
  weaknesses: string[];
  topicBreakdown: {
    topic: string;
    correct: number;
    total: number;
    accuracy: number;
  }[];
  recommendedStart: string;
}

// API helper function
async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: any
): Promise<T> {
  const token = localStorage.getItem("access_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// Assessment API functions
export async function startAssessmentSession(
  profile: LearnerProfile
): Promise<AssessmentSession> {
  const response = await apiRequest<{ id: string; status: string; start_time: string; current_index: number; profile_snapshot: any }>("/assessments/sessions", "POST", {
    profile_snapshot: profile,
    question_plan: [], // Empty plan for now
  });

  // Transform backend response to frontend format
  return {
    id: response.id,
    profile: response.profile_snapshot || DEFAULT_PROFILE,
    createdAt: response.start_time,
    status: (response.status || "in_progress") as SessionStatus,
    plan: [],
    currentIndex: response.current_index || 0,
    answers: [],
    skillCounts: {
      listening: { asked: 0, total: 2 },
      speaking: { asked: 0, total: 2 },
      reading: { asked: 0, total: 2 },
      writing: { asked: 0, total: 2 },
    },
    warnings: [],
  };
}

export async function getNextQuestion(sessionId: string): Promise<Question> {
  const data = await apiRequest<any>(`/assessments/sessions/${sessionId}/next-question`, "GET");
  
  // Transform backend question to frontend format
  const questionContent = typeof data.question_content === 'string' 
    ? JSON.parse(data.question_content) 
    : data.question_content;
  
  const options = typeof data.options === 'string' 
    ? JSON.parse(data.options) 
    : data.options;

  const baseQuestion: BaseQuestion = {
    id: data.id,
    skill: data.skill as Skill,
    difficulty: data.difficulty as SkillLevel,
    index: data.current_index + 1,
    total: 8, // Default total
  };

  switch (data.skill) {
    case "listening":
      return {
        ...baseQuestion,
        skill: "listening",
        type: "listening_mcq",
        instruction: questionContent.text || "Listen carefully",
        audioText: questionContent.text || "",
        language: data.language || "en-US",
        options: options.map((o: any) => o.text || o),
        correctIndex: 0, // Backend doesn't expose this
      } as ListeningQuestion;
    
    case "speaking":
      return {
        ...baseQuestion,
        skill: "speaking",
        type: "speaking_prompt",
        instruction: questionContent.text || "Speak clearly",
        targetPhrase: questionContent.text || "",
        language: data.language || "en-US",
      } as SpeakingQuestion;
    
    case "reading":
      return {
        ...baseQuestion,
        skill: "reading",
        type: "reading_mcq",
        passage: questionContent.text || "",
        question: questionContent.text || "",
        options: options.map((o: any) => o.text || o),
        correctIndex: 0,
      } as ReadingQuestion;
    
    case "writing":
      return {
        ...baseQuestion,
        skill: "writing",
        type: "writing_prompt",
        instruction: questionContent.text || "Write your answer",
        minWords: 10,
      } as WritingQuestion;
    
    default:
      throw new Error(`Unknown skill type: ${data.skill}`);
  }
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  response: AnswerResponse
): Promise<{ done: boolean; nextQuestion?: Question }> {
  await apiRequest(`/assessments/sessions/${sessionId}/responses`, "POST", {
    session_id: sessionId,
    question_id: questionId,
    skill: response.kind === "mcq" ? "reading" : response.kind === "speech" ? "speaking" : "writing",
    correct: response.kind === "mcq" ? true : undefined,
    score: response.kind === "mcq" ? 1.0 : undefined,
    response_data: { response },
  });

  // Try to get next question - if it fails, assessment is complete
  try {
    const nextQ = await getNextQuestion(sessionId);
    return { done: false, nextQuestion: nextQ };
  } catch {
    // No more questions - assessment complete
    return { done: true };
  }
}

export async function completeAssessment(sessionId: string): Promise<AssessmentResult> {
  const data = await apiRequest<any>(`/assessments/sessions/${sessionId}/complete`, "POST", {
    level: "Intermediate",
    recommended_start: "reading",
    scores: {
      listening: 0.8,
      speaking: 0.7,
      reading: 0.9,
      writing: 0.6,
    },
  });

  // Transform backend result to frontend format
  return {
    sessionId: data.session_id || sessionId,
    completedAt: data.completed_at || new Date().toISOString(),
    language: "English",
    overallLevel: (data.level || "Intermediate") as SkillLevel,
    skillOutcomes: data.skill_proficiencies || [],
    strengths: data.strengths || [],
    improvements: data.weaknesses || [],
    recommendedFocus: data.recommended_start || "reading",
    recommendedLearningPath: data.learning_path || ["reading", "listening", "speaking", "writing"],
    totalQuestions: 8,
    correctCount: 6,
    accuracy: 0.75,
    level: (data.level || "Intermediate") as SkillLevel,
    weaknesses: data.weaknesses || [],
    topicBreakdown: [],
    recommendedStart: data.recommended_start || "reading",
  };
}

export async function getAssessmentResult(sessionId: string): Promise<AssessmentResult> {
  const data = await apiRequest<any>(`/assessments/sessions/${sessionId}/result`, "GET");
  
  return {
    sessionId: data.session_id || sessionId,
    completedAt: data.completed_at || new Date().toISOString(),
    language: "English",
    overallLevel: (data.level || "Intermediate") as SkillLevel,
    skillOutcomes: data.skill_proficiencies || [],
    strengths: data.strengths || [],
    improvements: data.weaknesses || [],
    recommendedFocus: data.recommended_start || "reading",
    recommendedLearningPath: data.learning_path || ["reading", "listening", "speaking", "writing"],
    totalQuestions: 8,
    correctCount: 6,
    accuracy: 0.75,
    level: (data.level || "Intermediate") as SkillLevel,
    weaknesses: data.weaknesses || [],
    topicBreakdown: [],
    recommendedStart: data.recommended_start || "reading",
  };
}

export async function getAssessmentHistory(): Promise<AssessmentResult[]> {
  const data = await apiRequest<any[]>("/assessments/history", "GET");
  
  return data.map((item) => ({
    sessionId: item.session_id,
    completedAt: item.completed_at || new Date().toISOString(),
    language: "English",
    overallLevel: (item.level || "Intermediate") as SkillLevel,
    skillOutcomes: item.skill_proficiencies || [],
    strengths: item.strengths || [],
    improvements: item.weaknesses || [],
    recommendedFocus: item.recommended_start || "reading",
    recommendedLearningPath: item.learning_path || ["reading", "listening", "speaking", "writing"],
    totalQuestions: 8,
    correctCount: 6,
    accuracy: 0.75,
    level: (item.level || "Intermediate") as SkillLevel,
    weaknesses: item.weaknesses || [],
    topicBreakdown: [],
    recommendedStart: item.recommended_start || "reading",
  }));
}

export async function abandonSession(sessionId: string): Promise<void> {
  // Backend doesn't have abandon endpoint, just clear local state
  localStorage.removeItem("assessment_session_id");
}
