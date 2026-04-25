import { apiClient } from "@/lib/apiClient";

export type NewsItem = {
  id: number;
  title: string;
  body: string;
  mediaUrls: string[];
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

export type BroadcastItem = {
  id: number;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export type PollItem = {
  id: number;
  question: string;
  options: string[];
  voteCounts: number[];
  viewerVoteIndex: number | null;
  active: boolean;
  createdAt: string;
};

export type ViolationItem = {
  id: number;
  description: string;
  photoUrl: string | null;
  mediaUrls: string[];
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";
  reporterUserId: number;
  reporterName: string;
  createdAt: string;
};

type PageResponse<T> = {
  items: T[];
  nextCursor: string | null;
};

export function fetchNews() {
  return apiClient<PageResponse<NewsItem>>("/api/v1/news").then((response) => response.items);
}

export function createNews(payload: { title: string; body: string; mediaUrls: string[] }) {
  return apiClient<NewsItem>("/api/v1/board/news", {
    method: "POST",
    body: payload
  });
}

export function updateNews(newsId: number, payload: { title: string; body: string; mediaUrls: string[] }) {
  return apiClient<NewsItem>(`/api/v1/board/news/${newsId}`, {
    method: "PUT",
    body: payload
  });
}

export function deleteNews(newsId: number) {
  return apiClient<void>(`/api/v1/board/news/${newsId}`, {
    method: "DELETE"
  });
}

export function fetchBroadcasts() {
  return apiClient<PageResponse<BroadcastItem>>("/api/v1/broadcasts").then((response) => response.items);
}

export function createBroadcast(payload: { title: string; body: string }) {
  return apiClient<BroadcastItem>("/api/v1/board/broadcasts", {
    method: "POST",
    body: payload
  });
}

export function fetchPolls() {
  return apiClient<PollItem[]>("/api/v1/polls");
}

export function createPoll(payload: { question: string; options: string[] }) {
  return apiClient<PollItem>("/api/v1/board/polls", {
    method: "POST",
    body: payload
  });
}

export function votePoll(pollId: number, optionIndex: number) {
  return apiClient<PollItem>(`/api/v1/polls/${pollId}/vote`, {
    method: "POST",
    body: { optionIndex }
  });
}

export function fetchMyViolations() {
  return apiClient<ViolationItem[]>("/api/v1/violations/mine");
}

export function createViolation(payload: { description: string; photoUrl: string | null; mediaUrls: string[] }) {
  return apiClient<ViolationItem>("/api/v1/violations", {
    method: "POST",
    body: payload
  });
}

export function fetchAllViolations() {
  return apiClient<PageResponse<ViolationItem>>("/api/v1/board/violations").then((response) => response.items);
}

export function updateViolationStatus(violationId: number, status: ViolationItem["status"]) {
  return apiClient<ViolationItem>(`/api/v1/board/violations/${violationId}/status`, {
    method: "PATCH",
    body: { status }
  });
}
