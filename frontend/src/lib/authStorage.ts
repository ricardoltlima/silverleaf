const ACCESS_KEY = "silverleaf_access_token";
const REFRESH_KEY = "silverleaf_refresh_token";

export function getAccessToken(): string | null {
  const token = localStorage.getItem(ACCESS_KEY)?.trim();
  return token ? token : null;
}

export function setTokens(accessToken: string, refreshToken?: string | null) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
