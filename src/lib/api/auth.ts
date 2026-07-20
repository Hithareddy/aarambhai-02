/**
 * Authentication API service.
 *
 * Talks directly to the FastAPI backend auth endpoints and persists the issued
 * JWT tokens in localStorage so the assessment API can authenticate requests.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: `Request failed: ${response.status}` }));
    const detail = Array.isArray(error.detail)
      ? error.detail.map((d: { msg?: string }) => d.msg).join(", ")
      : error.detail;
    throw new Error(detail || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function storeTokens(tokens: TokenResponse): void {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
}

export async function register(fullName: string, email: string, password: string): Promise<void> {
  const tokens = await postJson<TokenResponse>("/auth/register", {
    full_name: fullName,
    email,
    password,
  });
  storeTokens(tokens);
}

export async function login(email: string, password: string): Promise<void> {
  const tokens = await postJson<TokenResponse>("/auth/login", { email, password });
  storeTokens(tokens);
}

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem("access_token"));
}
