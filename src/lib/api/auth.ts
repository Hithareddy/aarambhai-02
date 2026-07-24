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

function storeTokens(tokens: TokenResponse): void {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
}

export async function register(fullName: string, email: string, password: string): Promise<void> {
  const tokens = await apiRequest<TokenResponse>("/auth/register", "POST", {
    full_name: fullName,
    email,
    password,
  });
  storeTokens(tokens);
}

export async function login(email: string, password: string): Promise<void> {
  const tokens = await apiRequest<TokenResponse>("/auth/login", "POST", { email, password });
  storeTokens(tokens);
}

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem("access_token"));
}
