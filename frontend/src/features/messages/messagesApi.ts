import { apiClient } from "@/lib/apiClient";

export type UnreadCountResponse = {
  unreadCount: number;
};

export type DirectConversation = {
  otherUserId: number;
  otherUserName: string;
  otherUserPhotoUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type DirectMessage = {
  id: number;
  senderUserId: number;
  senderName: string;
  senderPhotoUrl: string | null;
  recipientUserId: number;
  recipientName: string;
  recipientPhotoUrl: string | null;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export function fetchUnreadCount() {
  return apiClient<UnreadCountResponse>("/api/v1/messages/unread-count");
}

export function fetchConversations() {
  return apiClient<DirectConversation[]>("/api/v1/messages/conversations");
}

export function fetchThread(otherUserId: number) {
  return apiClient<DirectMessage[]>(`/api/v1/messages/thread/${otherUserId}`);
}

export function sendMessage(recipientUserId: number, body: string) {
  return apiClient<DirectMessage>("/api/v1/messages", {
    method: "POST",
    body: { recipientUserId, body }
  });
}

export function markThreadAsRead(otherUserId: number) {
  return apiClient<void>(`/api/v1/messages/thread/${otherUserId}/read`, {
    method: "POST"
  });
}
