/**
 * Learner profile API service.
 *
 * Persists and retrieves the onboarding profile through the FastAPI backend
 * (`/learners`). All data is stored in PostgreSQL.
 */
import { ApiError, apiRequest } from "./http";

export interface LearnerProfileInput {
  name: string;
  age_group: string;
  educational_background: string;
  current_role: string;
  learning_goal: string;
  learning_language: string;
  current_familiarity: string;
  digital_comfort: string;
  website_language?: string;
}

export interface LearnerProfile extends LearnerProfileInput {
  id: string;
  user_id: string;
  assessment_completed: boolean;
  website_language: string;
  created_at: string;
  updated_at: string;
}

/** Create or update the current user's learner profile from onboarding data. */
export async function saveLearnerProfile(profile: LearnerProfileInput): Promise<LearnerProfile> {
  return apiRequest<LearnerProfile>("/learners/", "POST", profile);
}

/** Fetch the current user's learner profile, or null if none exists yet. */
export async function getLearnerProfile(): Promise<LearnerProfile | null> {
  try {
    return await apiRequest<LearnerProfile>("/learners/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}
