import { apiRequest } from "./http";

export interface ResourceItem {
  id: string;
  title: string;
  type: "article" | "cheat_sheet" | "worksheet" | "video";
  category: string;
  description: string;
  content?: string;
  youtube_id?: string;
  video_channel?: string;
  duration: string;
  download_url?: string;
  recommended_skill?: string;
  target_language: string;
  age_groups?: string;
  difficulty_level: string;
  is_active: boolean;
  created_at: string;
  is_bookmarked?: boolean;
}

export interface RecommendedResourceResponse {
  resources: ResourceItem[];
  recommendation_reason: string;
  target_skill: string;
}


export async function getResources(type?: string, search?: string): Promise<ResourceItem[]> {
  const params = new URLSearchParams();
  if (type && type !== "all") params.append("type", type);
  if (search) params.append("search", search);
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<ResourceItem[]>(`/resources${queryStr}`);
}

export async function getRecommendedResources(): Promise<RecommendedResourceResponse> {
  return apiRequest<RecommendedResourceResponse>("/resources/recommended");
}

export async function toggleBookmarkResource(resourceId: string): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`/resources/${resourceId}/bookmark`, "POST");
}

export async function getMyBookmarkedResources(): Promise<ResourceItem[]> {
  return apiRequest<ResourceItem[]>("/resources/bookmarks/me");
}
