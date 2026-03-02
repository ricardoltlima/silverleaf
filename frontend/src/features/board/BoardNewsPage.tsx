import { FormEvent, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createNews, deleteNews, fetchNews, updateNews } from "@/features/board/boardApi";
import { uploadFeedMedia } from "@/features/feed/feedApi";
import { fetchCurrentUser } from "@/features/users/currentUserApi";
import { isHoaManager } from "@/features/users/roleUtils";

function isVideoUrl(url: string): boolean {
  const value = url.toLowerCase();
  return value.endsWith(".mp4") || value.endsWith(".webm") || value.endsWith(".ogg") || value.includes("/video/");
}

export function BoardNewsPage() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchCurrentUser });
  const isAdmin = isHoaManager(meQuery.data?.role);
  const newsQuery = useQuery({ queryKey: ["board", "news"], queryFn: fetchNews });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const createMutation = useMutation({
    mutationFn: createNews,
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["board", "news"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { title: string; body: string; mediaUrls: string[] } }) =>
      updateNews(id, payload),
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["board", "news"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", "news"] });
      if (editingId !== null) {
        resetForm();
      }
    }
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFeedMedia,
    onSuccess: (uploaded) => {
      setMediaUrls((current) => [...current, uploaded.url]);
    }
  });

  const sortedNews = useMemo(
    () => [...(newsQuery.data ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [newsQuery.data]
  );

  function resetForm() {
    setTitle("");
    setBody("");
    setMediaUrls([]);
    setEditingId(null);
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) return;

    const payload = { title: cleanTitle, body: cleanBody, mediaUrls };
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }
    createMutation.mutate(payload);
  };

  const openEdit = (item: { id: number; title: string; body: string; mediaUrls: string[] }) => {
    setEditingId(item.id);
    setTitle(item.title);
    setBody(item.body);
    setMediaUrls(item.mediaUrls ?? []);
  };

  const onPickMedia = async (file: File | null) => {
    if (!file) return;
    await uploadMutation.mutateAsync(file);
  };

  return (
    <div className="space-y-4">
      {!isAdmin ? (
        <section className="card p-4 text-sm text-rose-700">Only HOA admins can access this page.</section>
      ) : null}

      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">Board</div>
        <h2 className="text-xl font-semibold text-slate-900">Silverleaf News</h2>
        <p className="mt-1 text-sm text-slate-600">Publish official community news to the right rail.</p>
      </section>

      <section className={`card p-4 ${isAdmin ? "" : "pointer-events-none opacity-60"}`}>
        <h3 className="mb-2 text-base font-semibold text-slate-900">{editingId ? "Edit news item" : "Create news item"}</h3>
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
            placeholder="News details"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Attach media
            </button>
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(event) => {
                void onPickMedia(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
            {uploadMutation.isPending ? <span className="text-xs text-slate-500">Uploading...</span> : null}
          </div>

          {mediaUrls.length ? (
            <div className="grid gap-2 md:grid-cols-3">
              {mediaUrls.map((url, index) => (
                <div key={`${url}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  {isVideoUrl(url) ? (
                    <video src={url} controls className="h-28 w-full rounded bg-black object-contain" />
                  ) : (
                    <a href={url} target="_blank" rel="noreferrer" className="block">
                      <img src={url} alt="News media" className="h-28 w-full rounded bg-slate-100 object-contain" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setMediaUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    className="mt-1 rounded border border-slate-300 px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-lg bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-70"
            >
              {editingId ? "Save changes" : "Publish news"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className={`card p-4 ${isAdmin ? "" : "pointer-events-none opacity-60"}`}>
        <h3 className="mb-2 text-base font-semibold text-slate-900">Published news</h3>
        {newsQuery.isLoading ? <p className="text-sm text-slate-500">Loading...</p> : null}
        {newsQuery.isError ? <p className="text-sm text-rose-700">{(newsQuery.error as Error).message}</p> : null}
        <div className="space-y-2">
          {sortedNews.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.authorName} - {new Date(item.updatedAt || item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="rounded border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-700">{item.body}</p>
              {item.mediaUrls?.length ? (
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  {item.mediaUrls.map((url, index) =>
                    isVideoUrl(url) ? (
                      <video
                        key={`${item.id}-video-${index}`}
                        src={url}
                        controls
                        className="h-32 w-full rounded bg-black object-contain"
                      />
                    ) : (
                      <a key={`${item.id}-img-${index}`} href={url} target="_blank" rel="noreferrer" className="block">
                        <img src={url} alt="News media" className="h-32 w-full rounded bg-slate-100 object-contain" />
                      </a>
                    )
                  )}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
