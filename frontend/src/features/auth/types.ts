export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type PublicConfig = {
  googleClientId: string | null;
  localLoginEnabled: boolean;
};

export type ResidentInvitation = {
  invitationToken: string;
  houseId: number;
  houseAddress: string;
  fullName: string;
  email: string;
  expired: boolean;
};

export type PublicHouse = {
  id: number;
  address: string;
  qrToken: string;
  status: string;
  claimedAt: string | null;
  residents: Array<{ id: number; fullName: string; email: string }>;
};

export type LocalRegisterPayload = {
  houseId: number;
  fullName: string;
  email: string;
  password: string;
};

export type LocalRegisterResponse = {
  auth: AuthResponse;
  house: PublicHouse;
};
