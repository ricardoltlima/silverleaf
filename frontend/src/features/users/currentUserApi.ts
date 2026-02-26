import { apiClient } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiClient";

export type CurrentUser = {
  id: number;
  email: string;
  fullName: string;
  role: string;
  photoUrl: string | null;
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
