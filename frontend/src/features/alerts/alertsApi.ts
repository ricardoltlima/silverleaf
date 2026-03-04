import { apiClient } from "@/lib/apiClient";

export type FeedReactionAlert = {
  id: number;
  postId: number;
  channel: "COMMUNITY" | "SERVICES" | "GROUP";
  groupSlug: string | null;
  actorUserId: number;
  actorName: string;
  actorPhotoUrl: string | null;
  reactionType: "HEART" | "CLAP" | "OK";
  postPreview: string;
  createdAt: string;
  unread: boolean;
};

export function fetchReactionAlerts() {
  return apiClient<FeedReactionAlert[]>("/api/v1/alerts/reactions");
}

export function markReactionAlertsRead() {
  return apiClient<void>("/api/v1/alerts/reactions/read-all", {
    method: "POST"
  });
}
