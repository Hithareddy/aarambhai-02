/**
 * Shared HTTP helper for talking to the FastAPI backend.
 *
 * Every learner-journey request goes through here so auth headers and error
 * handling are consistent. There is no mock fallback: the frontend talks only
 * to FastAPI.
 */

// The hosted preview runs on a *.lovable.app origin that the deployed FastAPI
// CORS config rejects, and "localhost:8000" is unreachable there too. So all
// calls go through the same-origin proxy route at /api/public/backend, which
// forwards to the real FastAPI backend (no CORS involved).
// Local devs can still point straight at their own server with
// VITE_API_URL=http://localhost:8000/api/v1 in a .env.local file.
export const API_BASE = import.meta.env.VITE_API_URL || "/api/public/backend";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((sub) => sub.resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(err: any) {
  refreshSubscribers.forEach((sub) => sub.reject(err));
  refreshSubscribers = [];
}

export async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
  isRetry: boolean = false
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
    if (response.status === 401 && !endpoint.startsWith("/auth/")) {
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken && !isRetry) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${refreshToken}`,
              },
            });

            if (refreshRes.ok) {
              const newTokens = await refreshRes.json();
              localStorage.setItem("access_token", newTokens.access_token);
              if (newTokens.refresh_token) {
                localStorage.setItem("refresh_token", newTokens.refresh_token);
              }
              isRefreshing = false;
              onRefreshed(newTokens.access_token);
              return apiRequest<T>(endpoint, method, body, true);
            } else {
              isRefreshing = false;
              onRefreshFailed(new ApiError("Refresh token invalid", 401));
            }
          } catch (err) {
            isRefreshing = false;
            onRefreshFailed(err);
          }
        } else {
          return new Promise<T>((resolve, reject) => {
            refreshSubscribers.push({
              resolve: (newToken: string) => {
                resolve(apiRequest<T>(endpoint, method, body, true));
              },
              reject: (err: any) => {
                reject(err);
              },
            });
          });
        }
      }

      // Token invalid/expired and refresh failed or not available.
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const publicRoutes = ["/login", "/signup", "/onboarding", "/role-selection", "/language-selection", "/assessment-intro"];
      if (!publicRoutes.includes(currentPath)) {
        window.location.href = "/login";
      }
    }
    const error = await response.json().catch(() => ({ detail: `API error: ${response.status}` }));
    const detail = (error as any)?.detail;
    // FastAPI can return a structured detail object (e.g. the profile gate).
    const message =
      typeof detail === "string"
        ? detail
        : detail?.message || detail?.code || `API error: ${response.status}`;
    const apiError = new ApiError(message, response.status);
    if (detail && typeof detail === "object") {
      (apiError as any).code = detail.code;
      (apiError as any).details = detail;
    }
    throw apiError;
  }




  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
