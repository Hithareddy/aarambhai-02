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
