import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBroadcast, fetchBroadcasts } from "@/features/board/boardApi";
import { fetchCurrentUser } from "@/features/users/currentUserApi";
import { canManageCommunity } from "@/features/users/roleUtils";

export function BoardBroadcastsPage() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchCurrentUser });
  const isAdmin = canManageCommunity(meQuery.data);
  const broadcastsQuery = useQuery({ queryKey: ["board", "broadcasts"], queryFn: fetchBroadcasts });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const createMutation = useMutation({
    mutationFn: createBroadcast,
    onSuccess: () => {
      setTitle("");
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["board", "broadcasts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts", "broadcasts"] });
    }
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) return;
    createMutation.mutate({ title: cleanTitle, body: cleanBody });
  };

  return (
    <div className="space-y-4">
      {!isAdmin ? (
        <section className="card p-4 text-sm text-rose-700">Only community admins can access this page.</section>
      ) : null}
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Board</div>
        <h2 className="text-xl font-semibold text-slate-900">Message Everyone</h2>
        <p className="mt-1 text-sm text-slate-600">Send global announcements to all residents.</p>
      </section>

      <section className={`card p-4 ${isAdmin ? "" : "pointer-events-none opacity-60"}`}>
        <h3 className="mb-2 text-base font-semibold text-slate-900">Create broadcast</h3>
        <form onSubmit={onSubmit} className="space-y-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={4}
            placeholder="Message to all residents"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-70"
          >
            Send broadcast
          </button>
        </form>
      </section>

      <section className={`card p-4 ${isAdmin ? "" : "pointer-events-none opacity-60"}`}>
        <h3 className="mb-2 text-base font-semibold text-slate-900">Recent broadcasts</h3>
        {broadcastsQuery.isLoading ? <p className="text-sm text-slate-500">Loading...</p> : null}
        {broadcastsQuery.isError ? (
          <p className="text-sm text-rose-700">{(broadcastsQuery.error as Error).message}</p>
        ) : null}
        <div className="space-y-2">
          {(broadcastsQuery.data ?? []).map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-700">{item.body}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.authorName} - {new Date(item.createdAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
