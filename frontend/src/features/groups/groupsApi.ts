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
  requestPending: boolean;
  requestStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  owner: boolean;
  pendingRequestCount: number;
  memberCount: number;
};

export type GroupJoinRequest = {
  requestId: number;
  groupId: number;
  groupName: string;
  requesterUserId: number;
  requesterName: string;
  requesterEmail: string;
  createdAt: string;
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

export function fetchGroupRequests() {
  return apiClient<GroupJoinRequest[]>("/api/v1/groups/requests");
}

export function approveGroupRequest(requestId: number) {
  return apiClient<GroupJoinRequest>(`/api/v1/groups/requests/${requestId}/approve`, {
    method: "POST"
  });
}

export function rejectGroupRequest(requestId: number) {
  return apiClient<GroupJoinRequest>(`/api/v1/groups/requests/${requestId}/reject`, {
    method: "POST"
  });
}
