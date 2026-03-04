import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchConversations,
  fetchThread,
  markThreadAsRead,
  sendMessage,
  type DirectConversation
} from "@/features/messages/messagesApi";
import { fetchCurrentUser } from "@/features/users/currentUserApi";
import { fetchNeighborProfile } from "@/features/neighbors/neighborsApi";

type MessagesPanelProps = {
  layout?: "page" | "modal";
  onClose?: () => void;
  initialSelectedUserId?: number | null;
};

const defaultAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' fill='%23d6e6f8'/%3E%3Ccircle cx='36' cy='27' r='14' fill='%23a5bfdc'/%3E%3Cellipse cx='36' cy='60' rx='22' ry='14' fill='%23a5bfdc'/%3E%3C/svg%3E";

export function MessagesPanel({ layout = "page", onClose, initialSelectedUserId = null }: MessagesPanelProps) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(initialSelectedUserId);
  const [draft, setDraft] = useState("");
  const threadContainerRef = useRef<HTMLDivElement | null>(null);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser
  });

  const conversationsQuery = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: fetchConversations,
    refetchInterval: 5000
  });

  const threadQuery = useQuery({
    queryKey: ["messages", "thread", selectedUserId],
    queryFn: () => fetchThread(selectedUserId as number),
    enabled: selectedUserId != null,
    refetchInterval: selectedUserId != null ? 3000 : false
  });
  const selectedNeighborQuery = useQuery({
    queryKey: ["neighbors", selectedUserId, "messages"],
    queryFn: () => fetchNeighborProfile(selectedUserId as number),
    enabled:
      selectedUserId != null &&
      !(conversationsQuery.data ?? []).some((conversation) => conversation.otherUserId === selectedUserId)
  });

  useEffect(() => {
    const firstConversation = conversationsQuery.data?.[0];
    if (selectedUserId == null && firstConversation) {
      setSelectedUserId(firstConversation.otherUserId);
    }
  }, [conversationsQuery.data, selectedUserId]);

  useEffect(() => {
    if (initialSelectedUserId != null) {
      setSelectedUserId(initialSelectedUserId);
    }
  }, [initialSelectedUserId]);

  useEffect(() => {
    const container = threadContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [selectedUserId, threadQuery.data]);

  const markReadMutation = useMutation({
    mutationFn: markThreadAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "unread-count"] });
    }
  });

  useEffect(() => {
    if (selectedUserId == null) return;
    markReadMutation.mutate(selectedUserId);
  }, [selectedUserId]);

  const sendMutation = useMutation({
    mutationFn: ({ recipientUserId, body }: { recipientUserId: number; body: string }) =>
      sendMessage(recipientUserId, body),
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["messages", "thread", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "unread-count"] });
    }
  });

  const selectedConversation = useMemo(
    () => conversationsQuery.data?.find((conversation) => conversation.otherUserId === selectedUserId) ?? null,
    [conversationsQuery.data, selectedUserId]
  );
  const selectedConversationName = selectedConversation?.otherUserName || selectedNeighborQuery.data?.fullName || "Select a conversation";

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (selectedUserId == null) return;
    const text = draft.trim();
    if (!text) return;
    sendMutation.mutate({ recipientUserId: selectedUserId, body: text });
  };

  const shellClass =
    layout === "modal"
      ? "flex h-[82vh] w-[min(980px,96vw)] overflow-hidden rounded-2xl bg-white shadow-2xl"
      : "card flex h-[calc(100vh-11rem)] min-h-[640px] overflow-hidden";

  return (
    <div className={shellClass}>
      <aside className="w-[300px] border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-base font-semibold text-slate-900">Messages</h3>
        </div>
        <div className="h-full overflow-y-auto p-2">
          {(conversationsQuery.data ?? []).length === 0 ? (
            <p className="p-3 text-sm text-slate-500">No conversations yet.</p>
          ) : (
            (conversationsQuery.data as DirectConversation[]).map((conversation) => (
              <button
                key={conversation.otherUserId}
                type="button"
                onClick={() => setSelectedUserId(conversation.otherUserId)}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
                  selectedUserId === conversation.otherUserId ? "bg-leaf-50" : "hover:bg-slate-100"
                }`}
              >
                <img
                  src={conversation.otherUserPhotoUrl || defaultAvatar}
                  alt={`${conversation.otherUserName} profile`}
                  className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{conversation.otherUserName}</p>
                  <p className="truncate text-xs text-slate-600">{conversation.lastMessage}</p>
                  {conversation.unreadCount > 0 ? (
                    <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                      {conversation.unreadCount} new
                    </span>
                  ) : null}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex flex-1 flex-col bg-white">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-slate-900">
              {selectedConversationName}
            </h4>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          ) : null}
        </header>

        <div ref={threadContainerRef} className="flex-1 overflow-y-auto bg-slate-50 p-4">
          {threadQuery.isLoading ? <p className="text-sm text-slate-500">Loading messages...</p> : null}
          {(threadQuery.data ?? []).map((message) => {
            const mine = message.senderUserId === meQuery.data?.id;
            return (
              <div key={message.id} className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[78%] items-start gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                  {!mine ? (
                    <img
                      src={message.senderPhotoUrl || defaultAvatar}
                      alt={`${message.senderName} profile`}
                      className="h-8 w-8 shrink-0 rounded-full border border-slate-200 object-cover shadow-sm"
                    />
                  ) : null}
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      mine ? "rounded-br-md bg-leaf-600 text-white" : "rounded-bl-md bg-white text-slate-800"
                    }`}
                  >
                    {!mine ? (
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {message.senderName}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-leaf-100" : "text-slate-400"}`}>
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={onSubmit} className="border-t border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={selectedUserId ? "Write a message..." : "Select a conversation first"}
              disabled={selectedUserId == null}
              className="w-full rounded-full border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2 disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={selectedUserId == null || sendMutation.isPending}
              className="rounded-full bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-70"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
