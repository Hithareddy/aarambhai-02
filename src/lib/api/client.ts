// Single entry point for API access. UI code imports `getApiClient()` and
// calls typed methods; swapping the mock for a real FastAPI HTTP client is a
// one-line change here — no component code changes.

import type {
  Assessment,
  AssessmentAnswer,
  AssessmentResult,
  DashboardSnapshot,
  NotificationItem,
} from "./types";
import { mockApiClient } from "./mock-client";

export interface ApiClient {
  getDashboardSnapshot(): Promise<DashboardSnapshot>;
  markNotificationRead(id: string): Promise<NotificationItem>;
  markAllNotificationsRead(): Promise<void>;
  getAssessment(id: string): Promise<Assessment>;
  submitAssessment(id: string, answers: AssessmentAnswer[]): Promise<AssessmentResult>;
}

let client: ApiClient = mockApiClient;

export function getApiClient(): ApiClient {
  return client;
}

// Escape hatch for tests / future swap to HttpApiClient.
export function __setApiClient(next: ApiClient) {
  client = next;
}
