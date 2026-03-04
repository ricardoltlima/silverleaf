import { apiClient } from "@/lib/apiClient";
import type {
  AuthResponse,
  LoginPayload,
  PublicConfig,
  PublicHouse,
  ResidentInvitation
} from "@/features/auth/types";

export function login(payload: LoginPayload) {
  return apiClient<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: payload,
    auth: false
  });
}

export function fetchPublicConfig() {
  return apiClient<PublicConfig>("/api/v1/public/onboarding/config", {
    auth: false
  });
}

export function fetchPublicHouses() {
  return apiClient<PublicHouse[]>("/api/v1/public/onboarding/houses", {
    auth: false
  });
}

export function fetchResidentInvitation(invitationToken: string) {
  return apiClient<ResidentInvitation>(`/api/v1/public/onboarding/invitations/${invitationToken}`, {
    auth: false
  });
}

export function acceptResidentInvitation(invitationToken: string) {
  return apiClient<{ houseId: number; houseAddress: string }>(`/api/v1/public/onboarding/invitations/${invitationToken}/accept`, {
    method: "POST"
  });
}

export function switchCommunity(communityId: number, refreshToken: string) {
  return apiClient<AuthResponse>("/api/v1/auth/switch-community", {
    method: "POST",
    body: { communityId, refreshToken }
  });
}
