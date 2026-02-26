import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchConversations,
  fetchThread,
  markThreadAsRead,
  sendMessage,
  type DirectConversation
} from "@/features/messages/messagesApi";
import { fetchCurrentUser } from "@/features/users/currentUserApi";

type MessagesModalProps = {
  open: boolean;
  onClose: () => void;
};

export function MessagesModal({ open, onClose }: MessagesModalProps) {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    enabled: open
  });

  const conversationsQuery = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: fetchConversations,
    enabled: open,
    refetchInterval: open ? 5000 : false
  });

  const threadQuery = useQuery({
    queryKey: ["messages", "thread", selectedUserId],
    queryFn: () => fetchThread(selectedUserId as number),
    enabled: open && selectedUserId != null,
    refetchInterval: open && selectedUserId != null ? 3000 : false
  });

  useEffect(() => {
    if (!open) return;
    const firstConversation = conversationsQuery.data?.[0];
    if (selectedUserId == null && firstConversation) {
      setSelectedUserId(firstConversation.otherUserId);
    }
  }, [conversationsQuery.data, open, selectedUserId]);

  const markReadMutation = useMutation({
    mutationFn: markThreadAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "unread-count"] });
    }
  });

  useEffect(() => {
    if (!open || selectedUserId == null) return;
    markReadMutation.mutate(selectedUserId);
  }, [open, selectedUserId]);

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

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (selectedUserId == null) return;
    const text = draft.trim();
    if (!text) return;
    sendMutation.mutate({ recipientUserId: selectedUserId, body: text });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex h-[82vh] w-[min(980px,96vw)] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <aside className="w-[300px] border-r border-slate-200">
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
                  className={`mb-1 w-full rounded-lg px-3 py-2 text-left ${
                    selectedUserId === conversation.otherUserId ? "bg-leaf-50" : "hover:bg-slate-100"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{conversation.otherUserName}</p>
                  <p className="truncate text-xs text-slate-600">{conversation.lastMessage}</p>
                  {conversation.unreadCount > 0 ? (
                    <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                      {conversation.unreadCount} new
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                {selectedConversation?.otherUserName || "Select a conversation"}
              </h4>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4">
            {threadQuery.isLoading ? <p className="text-sm text-slate-500">Loading messages...</p> : null}
            {(threadQuery.data ?? []).map((message) => {
              const mine = message.senderUserId === meQuery.data?.id;
              return (
                <div key={message.id} className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${
                      mine ? "bg-leaf-600 text-white" : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {message.body}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="border-t border-slate-200 p-3">
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
    </div>
  );
}
