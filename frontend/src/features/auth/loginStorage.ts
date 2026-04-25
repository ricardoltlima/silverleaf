const REMEMBERED_LOGIN_KEY = "app_remembered_login";

export type RememberedLogin = {
  houseId: number | null;
  houseAddress: string;
  identifier: string;
};

export function getRememberedLogin(): RememberedLogin | null {
  const raw = localStorage.getItem(REMEMBERED_LOGIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RememberedLogin;
  } catch {
    return null;
  }
}

export function setRememberedLogin(value: RememberedLogin) {
  localStorage.setItem(REMEMBERED_LOGIN_KEY, JSON.stringify(value));
}
