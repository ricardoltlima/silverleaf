import { apiClient } from "@/lib/apiClient";
import type {
  FeedComment,
  FeedCommentReactionResponse,
  FeedMedia,
  FeedLikeResponse,
  FeedPageResponse,
  FeedPost,
  FeedReactionType
} from "@/features/feed/types";

type CreatePostPayload = {
  text: string;
  media: FeedMedia[];
  channel?: "COMMUNITY" | "SERVICES" | "GROUP";
  groupSlug?: string;
};

type UploadMediaResponse = {
  type: "IMAGE" | "VIDEO" | "FILE";
  url: string;
};

export function fetchFeed(
  limit = 20,
  channel: "COMMUNITY" | "SERVICES" | "GROUP" = "COMMUNITY",
  groupSlug?: string,
  cursor?: string
) {
  const groupQuery = groupSlug ? `&groupSlug=${encodeURIComponent(groupSlug)}` : "";
  const cursorQuery = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
  return apiClient<FeedPageResponse>(`/api/v1/feed?limit=${limit}&channel=${channel}${groupQuery}${cursorQuery}`);
}

export function createFeedPost(payload: CreatePostPayload) {
  return apiClient<FeedPost>("/api/v1/feed/posts", {
    method: "POST",
    body: payload
  });
}

export function reactToPost(postId: number, reaction: FeedReactionType) {
  return apiClient<FeedLikeResponse>(`/api/v1/feed/posts/${postId}/likes?reaction=${reaction}`, {
    method: "POST"
  });
}

export function clearReaction(postId: number) {
  return apiClient<FeedLikeResponse>(`/api/v1/feed/posts/${postId}/likes`, {
    method: "DELETE"
  });
}

export function addComment(postId: number, text: string) {
  return apiClient<FeedComment>(`/api/v1/feed/posts/${postId}/comments`, {
    method: "POST",
    body: { text }
  });
}

export function reactToComment(postId: number, commentId: number, reaction: FeedReactionType) {
  return apiClient<FeedCommentReactionResponse>(
    `/api/v1/feed/posts/${postId}/comments/${commentId}/likes?reaction=${reaction}`,
    { method: "POST" }
  );
}

export function clearCommentReaction(postId: number, commentId: number) {
  return apiClient<FeedCommentReactionResponse>(
    `/api/v1/feed/posts/${postId}/comments/${commentId}/likes`,
    { method: "DELETE" }
  );
}

export function uploadFeedMedia(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient<UploadMediaResponse>("/api/v1/feed/uploads", {
    method: "POST",
    body: formData
  });
}
