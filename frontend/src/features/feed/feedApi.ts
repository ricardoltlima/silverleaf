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

export type FeedModerationReport = {
  targetType: "POST" | "COMMENT";
  postId: number;
  commentId: number | null;
  channel: "COMMUNITY" | "SERVICES" | "GROUP";
  groupSlug: string | null;
  authorUserId: number;
  authorName: string;
  authorPhotoUrl: string | null;
  bodyText: string | null;
  createdAt: string;
  media: FeedMedia[];
  reportCount: number;
  reporterNames: string[];
  latestReportedAt: string;
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

export function updateFeedPost(postId: number, text: string) {
  return apiClient<FeedPost>(`/api/v1/feed/posts/${postId}`, {
    method: "PUT",
    body: { text }
  });
}

export function deletePost(postId: number) {
  return apiClient<void>(`/api/v1/feed/posts/${postId}`, {
    method: "DELETE"
  });
}

export function reportPost(postId: number) {
  return apiClient<void>(`/api/v1/feed/posts/${postId}/reports`, {
    method: "POST"
  });
}

export function reportComment(postId: number, commentId: number) {
  return apiClient<void>(`/api/v1/feed/posts/${postId}/comments/${commentId}/reports`, {
    method: "POST"
  });
}

export function fetchReportedPosts() {
  return apiClient<FeedModerationReport[]>("/api/v1/feed/reports");
}

export function deleteReportedPost(postId: number) {
  return apiClient<void>(`/api/v1/feed/reports/posts/${postId}`, {
    method: "DELETE"
  });
}

export function deleteReportedComment(commentId: number) {
  return apiClient<void>(`/api/v1/feed/reports/comments/${commentId}`, {
    method: "DELETE"
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

export function updateComment(postId: number, commentId: number, text: string) {
  return apiClient<FeedComment>(`/api/v1/feed/posts/${postId}/comments/${commentId}`, {
    method: "PUT",
    body: { text }
  });
}

export function deleteComment(postId: number, commentId: number) {
  return apiClient<FeedComment>(`/api/v1/feed/posts/${postId}/comments/${commentId}`, {
    method: "DELETE"
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

export function uploadFeedMedia(file: File, attachment = false) {
  const formData = new FormData();
  formData.append("file", file);
  const attachmentQuery = attachment ? "?attachment=true" : "";
  return apiClient<UploadMediaResponse>(`/api/v1/feed/uploads${attachmentQuery}`, {
    method: "POST",
    body: formData
  });
}
