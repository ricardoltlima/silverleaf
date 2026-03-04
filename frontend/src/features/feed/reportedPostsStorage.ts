const REPORTED_POSTS_KEY_PREFIX = "silverleaf-reported-posts";
const REPORTED_COMMENTS_KEY_PREFIX = "silverleaf-reported-comments";

function storageKey(userId: number | undefined, communityId: number | null | undefined) {
  return `${REPORTED_POSTS_KEY_PREFIX}:${userId ?? "guest"}:${communityId ?? "none"}`;
}

export function getReportedPostIds(userId: number | undefined, communityId: number | null | undefined): number[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(storageKey(userId, communityId));
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is number => typeof value === "number");
  } catch {
    return [];
  }
}

export function markPostReported(userId: number | undefined, communityId: number | null | undefined, postId: number) {
  if (typeof window === "undefined") {
    return;
  }
  const current = getReportedPostIds(userId, communityId);
  if (current.includes(postId)) {
    return;
  }
  window.localStorage.setItem(storageKey(userId, communityId), JSON.stringify([...current, postId]));
}

function commentStorageKey(userId: number | undefined, communityId: number | null | undefined) {
  return `${REPORTED_COMMENTS_KEY_PREFIX}:${userId ?? "guest"}:${communityId ?? "none"}`;
}

export function getReportedCommentIds(userId: number | undefined, communityId: number | null | undefined): number[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(commentStorageKey(userId, communityId));
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is number => typeof value === "number");
  } catch {
    return [];
  }
}

export function markCommentReported(
  userId: number | undefined,
  communityId: number | null | undefined,
  commentId: number
) {
  if (typeof window === "undefined") {
    return;
  }
  const current = getReportedCommentIds(userId, communityId);
  if (current.includes(commentId)) {
    return;
  }
  window.localStorage.setItem(commentStorageKey(userId, communityId), JSON.stringify([...current, commentId]));
}
