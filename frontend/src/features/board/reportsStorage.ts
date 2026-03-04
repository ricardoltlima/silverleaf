const LAST_SEEN_REPORTS_AT_KEY = "silverleaf-last-seen-reports-at";

export function getLastSeenReportsAt(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(LAST_SEEN_REPORTS_AT_KEY);
}

export function markReportsSeen(timestamp: string = new Date().toISOString()) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(LAST_SEEN_REPORTS_AT_KEY, timestamp);
  window.dispatchEvent(new CustomEvent("silverleaf-reports-seen-changed"));
}
