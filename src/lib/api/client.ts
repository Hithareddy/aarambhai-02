// Single entry point for dashboard/notification API access. UI code imports
// `getApiClient()` and calls typed methods. This is backed by the real FastAPI
// client — there is no mock implementation.

import type { DashboardSnapshot, NotificationItem } from "./types";
import { apiRequest } from "./http";
import { getDashboardSnapshot, markAllNotificationsRead, markNotificationRead } from "./dashboard";

export interface ApiClient {
  getDashboardSnapshot(): Promise<DashboardSnapshot>;
  markNotificationRead(id: string): Promise<NotificationItem>;
  markAllNotificationsRead(): Promise<void>;

  // Sprint 11: Unified Learning
  getTodaysLearning(): Promise<any>;
}

const httpApiClient: ApiClient = {
  getDashboardSnapshot,
  markNotificationRead,
  markAllNotificationsRead,
  getTodaysLearning: () => apiRequest("/practice/todays-learning")
};

let client: ApiClient = httpApiClient;

export function getApiClient(): ApiClient {
  return client;
}

// Escape hatch for tests.
export function __setApiClient(next: ApiClient) {
  client = next;
}
