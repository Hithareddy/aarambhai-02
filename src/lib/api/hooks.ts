import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getApiClient } from "./client";
import type { AssessmentAnswer } from "./types";

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  notifications: ["notifications"] as const,
  assessment: (id: string) => ["assessment", id] as const,
};

export function assessmentQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.assessment(id),
    queryFn: () => getApiClient().getAssessment(id),
    staleTime: 60_000,
  });
}

export function useAssessment(id: string) {
  return useQuery(assessmentQueryOptions(id));
}

export function useSubmitAssessment(id: string) {
  return useMutation({
    mutationFn: (answers: AssessmentAnswer[]) => getApiClient().submitAssessment(id, answers),
  });
}

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
