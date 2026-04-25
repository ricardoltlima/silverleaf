const LAST_SEEN_KEY = "app-group-last-seen";

export type GroupLastSeen = Record<string, string>;

export function getLastSeen(): GroupLastSeen {
  try {
    const raw = localStorage.getItem(LAST_SEEN_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as GroupLastSeen;
  } catch {
    return {};
  }
}

export function markGroupSeen(slug: string, timestampIso: string) {
  const current = getLastSeen();
  current[slug] = timestampIso;
  localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent("app-group-seen-changed"));
}

