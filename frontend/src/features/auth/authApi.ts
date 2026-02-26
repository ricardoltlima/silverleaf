import { apiClient } from "@/lib/apiClient";
import type { AuthResponse, LoginPayload } from "@/features/auth/types";

export function login(payload: LoginPayload) {
  return apiClient<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: payload,
    auth: false
  });
}
