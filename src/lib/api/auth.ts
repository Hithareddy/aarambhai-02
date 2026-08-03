/**
 * Authentication API service.
 *
 * Talks directly to the FastAPI backend auth endpoints and persists the issued
 * JWT tokens in localStorage so the assessment API can authenticate requests.
 */

import { apiRequest } from "./http";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export function clearUserSessionState(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  // Remove user-specific session items from localStorage (preserve language settings)
  const userKeys = [
    "assessment_session_id",
    "aarambh_assessment_session_id",
    "aarambh_tutor_active_conv_id",
    "aarambh_current_lesson_id",
    "pending_signup_name",
  ];
  for (const key of userKeys) {
    localStorage.removeItem(key);
  }
}

function storeTokens(tokens: TokenResponse): void {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
}

export async function register(fullName: string, email: string, password: string): Promise<void> {
  clearUserSessionState();
  if (fullName.trim()) {
    localStorage.setItem("pending_signup_name", fullName.trim());
  }
  const tokens = await apiRequest<TokenResponse>("/auth/register", "POST", {
    full_name: fullName,
    email,
    password,
  });
  storeTokens(tokens);
}

export async function login(email: string, password: string): Promise<void> {
  clearUserSessionState();
  const tokens = await apiRequest<TokenResponse>("/auth/login", "POST", { email, password });
  storeTokens(tokens);
}

export function logout(): void {
  clearUserSessionState();
}

export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem("access_token"));
}
