const LAST_SEEN_VIOLATIONS_KEY = "silverleaf-violations-last-seen-at";

export function getLastSeenViolationsAt(): string | null {
  return window.localStorage.getItem(LAST_SEEN_VIOLATIONS_KEY);
}

export function markViolationsSeen(timestamp: string) {
  window.localStorage.setItem(LAST_SEEN_VIOLATIONS_KEY, timestamp);
  window.dispatchEvent(new CustomEvent("silverleaf-violations-seen-changed", { detail: timestamp }));
}
