import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getApiClient } from "./client";

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  notifications: ["notifications"] as const,
};

export const dashboardQueryOptions = queryOptions({
  queryKey: queryKeys.dashboard,
  queryFn: () => getApiClient().getDashboardSnapshot(),
  staleTime: 60_000,
});

export function useDashboard() {
  return useQuery(dashboardQueryOptions);
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getApiClient().markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => getApiClient().markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
  });
}

// Sprint 11: Unified Learning Engine Hooks
export const practiceQueryKeys = {
  todaysLearning: ["practice", "todaysLearning"] as const,
};

export function useTodaysLearning() {
  return useQuery({
    queryKey: practiceQueryKeys.todaysLearning,
    queryFn: () => getApiClient().getTodaysLearning(),
    staleTime: 60_000,
  });
}

// Active Learning-Time Tracking Hooks
export const activityQueryKeys = {
  summary: (period: string, dateStr?: string) => ["activity", "summary", period, dateStr || "today"] as const,
  today: (dateStr?: string) => ["activity", "today", dateStr || "today"] as const,
  month: (year: number, month: number) => ["activity", "month", year, month] as const,
  streak: (dateStr?: string) => ["activity", "streak", dateStr || "today"] as const,
};

export function useActivitySummary(period: "today" | "week" | "month" = "today", dateStr?: string) {
  return useQuery({
    queryKey: activityQueryKeys.summary(period, dateStr),
    queryFn: () => getApiClient().getActivitySummary(period, dateStr),
    staleTime: 15_000,
  });
}

export function useMonthActivity(year: number, month: number) {
  return useQuery({
    queryKey: activityQueryKeys.month(year, month),
    queryFn: () => getApiClient().getMonthActivity(year, month),
    staleTime: 15_000,
  });
}

export function useStreakStats(dateStr?: string) {
  return useQuery({
    queryKey: activityQueryKeys.streak(dateStr),
    queryFn: () => getApiClient().getStreakStats(dateStr),
    staleTime: 15_000,
  });
}

export function useSyncActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => getApiClient().syncActivity(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateDailyGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalMinutes: number) => getApiClient().updateDailyGoal(goalMinutes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// Word of the Day & Vocabulary Hooks
export const vocabularyQueryKeys = {
  today: (dateStr?: string) => ["vocabulary", "today", dateStr || "today"] as const,
  myWords: ["vocabulary", "myWords"] as const,
};

export function useWordOfTheDay(dateStr?: string) {
  return useQuery({
    queryKey: vocabularyQueryKeys.today(dateStr),
    queryFn: () => getApiClient().getWordOfTheDay(dateStr),
    staleTime: 60_000,
  });
}

export function useMyWords() {
  return useQuery({
    queryKey: vocabularyQueryKeys.myWords,
    queryFn: () => getApiClient().getMyWords(),
    staleTime: 30_000,
  });
}

export function useCheckSentence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sentence, dateStr }: { sentence: string; dateStr?: string }) =>
      getApiClient().checkSentence(sentence, dateStr),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vocabulary"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// AI Tutor Hooks
export const tutorQueryKeys = {
  profile: ["tutor", "profile"] as const,
  conversations: ["tutor", "conversations"] as const,
  messages: (conversationId: string) => ["tutor", "messages", conversationId] as const,
};

export function useTutorProfile() {
  return useQuery({
    queryKey: tutorQueryKeys.profile,
    queryFn: () => getApiClient().getTutorProfile(),
    staleTime: 60_000,
  });
}

export function useUpdateTutorName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tutorName: string) => getApiClient().updateTutorName(tutorName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tutorQueryKeys.profile });
      qc.invalidateQueries({ queryKey: tutorQueryKeys.conversations });
    },
  });
}

export function useTutorConversations() {
  return useQuery({
    queryKey: tutorQueryKeys.conversations,
    queryFn: () => getApiClient().getTutorConversations(),
    staleTime: 30_000,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => getApiClient().createTutorConversation(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tutorQueryKeys.conversations });
    },
  });
}

export function useTutorMessages(conversationId?: string) {
  return useQuery({
    queryKey: tutorQueryKeys.messages(conversationId || ""),
    queryFn: () => getApiClient().getTutorMessages(conversationId!),
    enabled: Boolean(conversationId),
    staleTime: 10_000,
  });
}

export function useSendTutorMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      message,
      mode,
      modeParams,
    }: {
      conversationId: string;
      message: string;
      mode?: string;
      modeParams?: Record<string, string>;
    }) => getApiClient().sendTutorMessage(conversationId, message, mode, modeParams),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: tutorQueryKeys.messages(variables.conversationId) });
      qc.invalidateQueries({ queryKey: tutorQueryKeys.conversations });
    },
  });
}

export function useSendTutorVoiceMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      audioBlob,
      mode,
      modeParams,
    }: {
      conversationId: string;
      audioBlob: Blob;
      mode?: string;
      modeParams?: Record<string, unknown>;
    }) => getApiClient().sendTutorVoiceMessage(conversationId, audioBlob, mode, modeParams),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: tutorQueryKeys.messages(variables.conversationId) });
      qc.invalidateQueries({ queryKey: tutorQueryKeys.conversations });
    },
  });
}
