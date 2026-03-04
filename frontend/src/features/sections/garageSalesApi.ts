import { apiClient } from "@/lib/apiClient";
import type { FeedMedia } from "@/features/feed/types";

export type GarageSaleItem = {
  id: number;
  sellerUserId: number;
  title: string;
  price: string;
  condition: string;
  category: string;
  description: string | null;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string | null;
  sellerPhotoUrl: string | null;
  createdAt: string;
  media: FeedMedia[];
};

export type CreateGarageSaleItemPayload = {
  title: string;
  price: string;
  condition: string;
  category: string;
  description: string | null;
  media: FeedMedia[];
};

export type UpdateGarageSaleItemPayload = {
  title: string;
  price: string;
  condition: string;
  category: string;
  description: string | null;
};

export function fetchGarageSaleItems() {
  return apiClient<GarageSaleItem[]>("/api/v1/garage-sales");
}

export function createGarageSaleItem(payload: CreateGarageSaleItemPayload) {
  return apiClient<GarageSaleItem>("/api/v1/garage-sales", {
    method: "POST",
    body: payload
  });
}

export function updateGarageSaleItem(itemId: number, payload: UpdateGarageSaleItemPayload) {
  return apiClient<GarageSaleItem>(`/api/v1/garage-sales/${itemId}`, {
    method: "PUT",
    body: payload
  });
}

export function deleteGarageSaleItem(itemId: number) {
  return apiClient<void>(`/api/v1/garage-sales/${itemId}`, {
    method: "DELETE"
  });
}
