export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};
