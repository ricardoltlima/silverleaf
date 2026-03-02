import { apiClient } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiClient";
import type { UserRole } from "@/features/users/roleUtils";

export type CurrentUser = {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  photoUrl: string | null;
};

export type MyProfile = {
  id: number;
  email: string;
  fullName: string;
  photoUrl: string | null;
  phoneNumber: string | null;
  address: string | null;
  addressVisible: boolean;
  serviceEnabled: boolean;
  serviceTitle: string | null;
  serviceDescription: string | null;
  serviceContactPhone: string | null;
  serviceContactEmail: string | null;
  serviceBusinessUrl: string | null;
  serviceHours: string | null;
  serviceArea: string | null;
  serviceVisibility: "PUBLIC" | "GROUPS";
};

export type UpdateMyProfilePayload = {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  password: string | null;
  addressVisible: boolean;
  serviceEnabled: boolean;
  serviceTitle: string | null;
  serviceDescription: string | null;
  serviceContactPhone: string | null;
  serviceContactEmail: string | null;
  serviceBusinessUrl: string | null;
  serviceHours: string | null;
  serviceArea: string | null;
  serviceVisibility: "PUBLIC" | "GROUPS";
};

export type MyHousehold = {
  houseId: number;
  houseAddress: string;
  houseStatus: string;
  residents: Array<{ id: number; fullName: string; email: string }>;
};

export function fetchCurrentUser() {
  return apiClient<CurrentUser>("/api/v1/me");
}

export function fetchMyProfile() {
  return apiClient<MyProfile>("/api/v1/me/profile");
}

export function updateMyProfile(payload: UpdateMyProfilePayload) {
  return apiClient<MyProfile>("/api/v1/me/profile", {
    method: "PUT",
    body: payload
  });
}

export function fetchMyHousehold() {
  return apiClient<MyHousehold>("/api/v1/me/household").catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) {
      // Users without an onboarding-linked house should still be able to use the app.
      return null;
    }
    throw error;
  });
}

export function uploadMyProfilePhoto(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient<CurrentUser>("/api/v1/me/photo", {
    method: "POST",
    body: formData
  });
}
