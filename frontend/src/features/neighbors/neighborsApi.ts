import { apiClient } from "@/lib/apiClient";

export type NeighborListItem = {
  id: number;
  fullName: string;
  photoUrl: string | null;
  address: string | null;
  serviceEnabled: boolean;
  serviceTitle: string | null;
};

export type NeighborProfile = {
  id: number;
  fullName: string;
  email: string;
  photoUrl: string | null;
  address: string | null;
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

export function fetchNeighbors() {
  return apiClient<NeighborListItem[]>("/api/v1/neighbors");
}

export function fetchNeighborProfile(neighborId: number) {
  return apiClient<NeighborProfile>(`/api/v1/neighbors/${neighborId}`);
}
