import { apiClient } from "@/lib/apiClient";
import type { PublicHouse } from "@/features/auth/types";
import type { UserRole } from "@/features/users/roleUtils";

export type ResidentDirectoryItem = {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  enabled: boolean;
  communityAdmin: boolean;
};

type ResidentsPage = {
  content: ResidentDirectoryItem[];
};

export type ResidentInvitationResult = {
  residentId: number;
  fullName: string;
  email: string;
  role: UserRole;
  houseId: number;
  houseAddress: string;
  invitationToken: string;
  invitationUrl: string;
  expiresAt: string;
};

export function fetchManagedResidents(query = "") {
  const params = new URLSearchParams({
    page: "0",
    size: "100",
    q: query
  });
  return apiClient<ResidentsPage>(`/api/v1/residents?${params.toString()}`).then((response) => response.content);
}

export function fetchHousesForHoaDesk() {
  return apiClient<PublicHouse[]>("/api/v1/houses");
}

export function createResidentInvitation(payload: {
  fullName: string;
  email: string;
  password: string;
  houseId: number;
  role: Exclude<UserRole, "ADMIN">;
  communityAdmin: boolean;
}) {
  return apiClient<ResidentInvitationResult>("/api/v1/residents/invitations", {
    method: "POST",
    body: payload
  });
}

export function updateManagedResident(
  residentId: number,
  payload: {
    fullName: string;
    email: string;
    password: string | null;
    role: UserRole;
    communityAdmin: boolean;
  }
) {
  return apiClient<ResidentDirectoryItem>(`/api/v1/residents/${residentId}`, {
    method: "PUT",
    body: payload
  });
}

export function deactivateManagedResident(residentId: number) {
  return apiClient<ResidentDirectoryItem>(`/api/v1/residents/${residentId}/deactivate`, {
    method: "PATCH"
  });
}

export function activateManagedResident(residentId: number) {
  return apiClient<ResidentDirectoryItem>(`/api/v1/residents/${residentId}/activate`, {
    method: "PATCH"
  });
}
