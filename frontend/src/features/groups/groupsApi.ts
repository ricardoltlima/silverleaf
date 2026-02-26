import { apiClient } from "@/lib/apiClient";

export type GroupItem = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  ownerUserId: number;
  ownerName: string;
  subscribed: boolean;
  memberCount: number;
};

export type CreateGroupPayload = {
  name: string;
  description: string;
  visibility: "PUBLIC" | "PRIVATE";
};

export function fetchGroups() {
  return apiClient<GroupItem[]>("/api/v1/groups");
}

export function createGroup(payload: CreateGroupPayload) {
  return apiClient<GroupItem>("/api/v1/groups", {
    method: "POST",
    body: payload
  });
}

export function subscribeGroup(groupId: number) {
  return apiClient<GroupItem>(`/api/v1/groups/${groupId}/subscribe`, {
    method: "POST"
  });
}

export function unsubscribeGroup(groupId: number) {
  return apiClient<GroupItem>(`/api/v1/groups/${groupId}/unsubscribe`, {
    method: "POST"
  });
}
