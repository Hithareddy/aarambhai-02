/**
 * Shared HTTP helper for talking to the FastAPI backend.
 *
 * Every learner-journey request goes through here so auth headers and error
 * handling are consistent. There is no mock fallback: the frontend talks only
 * to FastAPI.
 */

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(
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
    throw new ApiError(error.detail || `API error: ${response.status}`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
