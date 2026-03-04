const ACCESS_KEY = "silverleaf_access_token";
const REFRESH_KEY = "silverleaf_refresh_token";
const COMMUNITY_KEY = "silverleaf_active_community";

export type ActiveCommunitySession = {
  id: number;
  slug: string;
  name: string;
};

export function getAccessToken(): string | null {
  const token = localStorage.getItem(ACCESS_KEY)?.trim();
  return token ? token : null;
}

export function getRefreshToken(): string | null {
  const token = localStorage.getItem(REFRESH_KEY)?.trim();
  return token ? token : null;
}

export function getActiveCommunity(): ActiveCommunitySession | null {
  const raw = localStorage.getItem(COMMUNITY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActiveCommunitySession;
  } catch {
    localStorage.removeItem(COMMUNITY_KEY);
    return null;
  }
}

export function setTokens(
  accessToken: string,
  refreshToken?: string | null,
  activeCommunity?: ActiveCommunitySession | null
) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
  if (activeCommunity) {
    localStorage.setItem(COMMUNITY_KEY, JSON.stringify(activeCommunity));
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(COMMUNITY_KEY);
}
