// Single entry point for dashboard/notification API access. UI code imports
// `getApiClient()` and calls typed methods. This is backed by the real FastAPI
// client — there is no mock implementation.

import type { ActivitySummary, ActivitySyncPayload, ChatMessageResult, DailyActivityRecord, DashboardSnapshot, MonthCalendarData, MyWordsData, NotificationItem, ScreenContextPayload, SentenceCheckResult, StreakData, TutorConversation, TutorMessage, TutorProfile, VoiceChatResult, WordOfTheDay } from "./types";
import { apiRequest, API_BASE } from "./http";
import { getDashboardSnapshot, markAllNotificationsRead, markNotificationRead } from "./dashboard";

export interface ApiClient {
  getDashboardSnapshot(): Promise<DashboardSnapshot>;
  markNotificationRead(id: string): Promise<NotificationItem>;
  markAllNotificationsRead(): Promise<void>;

  // Sprint 11: Unified Learning
  getTodaysLearning(): Promise<any>;

  // Active Learning-Time Tracking & Daily Goal & Streak
  syncActivity(payload: ActivitySyncPayload): Promise<DailyActivityRecord>;
  getTodayActivity(dateStr?: string): Promise<DailyActivityRecord>;
  getActivitySummary(period?: "today" | "week" | "month", dateStr?: string): Promise<ActivitySummary>;
  getMonthActivity(year: number, month: number): Promise<MonthCalendarData>;
  getStreakStats(dateStr?: string): Promise<StreakData>;
  updateDailyGoal(goalMinutes: number, dateStr?: string): Promise<DailyActivityRecord>;

  // Word of the Day & My Words
  getWordOfTheDay(dateStr?: string): Promise<WordOfTheDay>;
  checkSentence(sentence: string, dateStr?: string): Promise<SentenceCheckResult>;
  getMyWords(): Promise<MyWordsData>;

  // AI Tutor
  getTutorProfile(): Promise<TutorProfile>;
  updateTutorName(tutorName: string): Promise<TutorProfile>;
  getTutorConversations(): Promise<TutorConversation[]>;
  createTutorConversation(): Promise<TutorConversation>;
  getTutorMessages(conversationId: string): Promise<TutorMessage[]>;
  sendTutorMessage(conversationId: string, message: string, mode?: string, modeParams?: Record<string, string>, screenContext?: ScreenContextPayload): Promise<ChatMessageResult>;
  sendTutorVoiceMessage(conversationId: string, audioBlob: Blob, mode?: string, modeParams?: Record<string, unknown>, screenContext?: ScreenContextPayload): Promise<VoiceChatResult>;
  getVoiceAudio(token: string): Promise<string>; // returns object URL
}

const httpApiClient: ApiClient = {
  getDashboardSnapshot,
  markNotificationRead,
  markAllNotificationsRead,
  getTodaysLearning: () => apiRequest("/practice/todays-learning"),
  syncActivity: (payload: ActivitySyncPayload) => apiRequest<DailyActivityRecord>("/activity/sync", "POST", payload),
  getTodayActivity: (dateStr?: string) =>
    apiRequest<DailyActivityRecord>(`/activity/today${dateStr ? `?date=${dateStr}` : ""}`),
  getActivitySummary: (period: "today" | "week" | "month" = "today", dateStr?: string) =>
    apiRequest<ActivitySummary>(
      `/activity/summary?period=${period}${dateStr ? `&date=${dateStr}` : ""}`
    ),
  getMonthActivity: (year: number, month: number) =>
    apiRequest<MonthCalendarData>(`/activity/month?year=${year}&month=${month}`),
  getStreakStats: (dateStr?: string) =>
    apiRequest<StreakData>(`/activity/streak${dateStr ? `?date=${dateStr}` : ""}`),
  updateDailyGoal: (goalMinutes: number, dateStr?: string) =>
    apiRequest<DailyActivityRecord>(`/activity/goal${dateStr ? `?date=${dateStr}` : ""}`, "PUT", {
      goal_minutes: goalMinutes,
    }),
  getWordOfTheDay: (dateStr?: string) =>
    apiRequest<WordOfTheDay>(`/vocabulary/today${dateStr ? `?date=${dateStr}` : ""}`),
  checkSentence: (sentence: string, dateStr?: string) =>
    apiRequest<SentenceCheckResult>(`/vocabulary/check-sentence${dateStr ? `?date=${dateStr}` : ""}`, "POST", { sentence }),
  getMyWords: () => apiRequest<MyWordsData>("/vocabulary/my-words"),
  getTutorProfile: () => apiRequest<TutorProfile>("/tutor/profile"),
  updateTutorName: (tutorName: string) =>
    apiRequest<TutorProfile>("/tutor/name", "PUT", { tutor_name: tutorName }),
  getTutorConversations: () => apiRequest<TutorConversation[]>("/tutor/conversations"),
  createTutorConversation: () => apiRequest<TutorConversation>("/tutor/conversations/new", "POST"),
  getTutorMessages: (conversationId: string) =>
    apiRequest<TutorMessage[]>(`/tutor/conversations/${conversationId}/messages`),
  sendTutorMessage: (conversationId: string, message: string, mode?: string, modeParams?: Record<string, string>, screenContext?: ScreenContextPayload) =>
    apiRequest<ChatMessageResult>(`/tutor/conversations/${conversationId}/chat`, "POST", {
      message,
      ...(mode ? { mode } : {}),
      ...(modeParams ? { mode_params: modeParams } : {}),
      ...(screenContext ? { screen_context: screenContext } : {}),
    }),
  sendTutorVoiceMessage: async (conversationId: string, audioBlob: Blob, mode = "free_talk", modeParams?: Record<string, unknown>, screenContext?: ScreenContextPayload): Promise<VoiceChatResult> => {
    const token = localStorage.getItem("access_token");
    const form = new FormData();
    form.append("audio_file", audioBlob, audioBlob.type.includes("mp4") ? "voice.mp4" : "voice.webm");
    form.append("mode", mode);
    form.append("mode_params_json", JSON.stringify(modeParams ?? {}));
    if (screenContext) {
      form.append("screen_context_json", JSON.stringify(screenContext));
    }
    const res = await fetch(`${API_BASE}/tutor/conversations/${conversationId}/voice-chat`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? "Voice chat request failed");
    }
    return res.json();
  },
  getVoiceAudio: async (audioToken: string): Promise<string> => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_BASE}/tutor/voice-audio/${audioToken}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Audio playback token expired or not found");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};

let client: ApiClient = httpApiClient;

export function getApiClient(): ApiClient {
  return client;
}

// Escape hatch for tests.
export function __setApiClient(next: ApiClient) {
  client = next;
}
