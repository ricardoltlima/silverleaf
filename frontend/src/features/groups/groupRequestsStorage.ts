const LAST_SEEN_GROUP_REQUESTS_KEY = "app-group-requests-last-seen-at";

export function getLastSeenGroupRequestsAt(): string | null {
  return window.localStorage.getItem(LAST_SEEN_GROUP_REQUESTS_KEY);
}

export function markGroupRequestsSeen(timestamp: string) {
  window.localStorage.setItem(LAST_SEEN_GROUP_REQUESTS_KEY, timestamp);
  window.dispatchEvent(new CustomEvent("app-group-requests-seen-changed", { detail: timestamp }));
}

