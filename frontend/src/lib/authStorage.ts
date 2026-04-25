const ACCESS_TOKEN_KEY = "app_access_token";
const REFRESH_TOKEN_KEY = "app_refresh_token";
const ACTIVE_COMMUNITY_KEY = "app_active_community";

export type ActiveCommunitySession = {
  id: number;
  slug: string;
  name: string;
};

export function getAccessToken(): string | null {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)?.trim();
  return token ? token : null;
}

export function getRefreshToken(): string | null {
  const token = localStorage.getItem(REFRESH_TOKEN_KEY)?.trim();
  return token ? token : null;
}

export function getActiveCommunity(): ActiveCommunitySession | null {
  const raw = localStorage.getItem(ACTIVE_COMMUNITY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActiveCommunitySession;
  } catch {
    localStorage.removeItem(ACTIVE_COMMUNITY_KEY);
    return null;
  }
}

export function setTokens(
  accessToken: string,
  refreshToken?: string | null,
  activeCommunity?: ActiveCommunitySession | null
) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  if (activeCommunity) {
    localStorage.setItem(ACTIVE_COMMUNITY_KEY, JSON.stringify(activeCommunity));
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ACTIVE_COMMUNITY_KEY);
}
