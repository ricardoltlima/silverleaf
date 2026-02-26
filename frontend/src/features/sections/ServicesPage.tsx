import { FormEvent, type ChangeEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFeedPost, fetchFeed, uploadFeedMedia } from "@/features/feed/feedApi";
import type { FeedMedia, FeedPageResponse } from "@/features/feed/types";
import { MediaCarousel } from "@/features/layout/MediaCarousel";

const SERVICES_FEED_QUERY_KEY = ["feed", "services"];

export function ServicesPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [queuedMedia, setQueuedMedia] = useState<FeedMedia[]>([]);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const servicesFeedQuery = useQuery({
    queryKey: SERVICES_FEED_QUERY_KEY,
    queryFn: () => fetchFeed(25, "SERVICES"),
    staleTime: Infinity
  });

  const createPostMutation = useMutation({
    mutationFn: createFeedPost,
    onSuccess: (post) => {
      setDraft("");
      setQueuedMedia([]);
      queryClient.setQueryData<FeedPageResponse>(SERVICES_FEED_QUERY_KEY, (current) => {
        if (!current) {
          return { items: [post], nextCursor: null };
        }
        return {
          ...current,
          items: [post, ...current.items]
        };
      });
    }
  });

  const mediaUploadMutation = useMutation({
    mutationFn: uploadFeedMedia
  });

  const onAttachClick = () => {
    mediaInputRef.current?.click();
  };

  const onMediaSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const uploaded: FeedMedia[] = [];
    for (const file of files) {
      const result = await mediaUploadMutation.mutateAsync(file);
      uploaded.push({ type: result.type, url: result.url });
    }
    setQueuedMedia((current) => [...current, ...uploaded]);
    event.target.value = "";
  };

  const onPost = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text && queuedMedia.length === 0) return;
    createPostMutation.mutate({ text, media: queuedMedia, channel: "SERVICES" });
  };

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          Services
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Services Feed</h2>
        <p className="mt-1 text-sm text-slate-600">All community services in one place.</p>
      </section>

      <section className="card p-4">
        <form onSubmit={onPost} className="flex items-center gap-2">
          <div className="relative w-full">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Share your services with your neighbors..."
              className="w-full rounded-full border border-slate-300 px-4 py-2 pr-12 text-sm outline-none ring-leaf-600 focus:ring-2"
            />
            <button
              type="button"
              onClick={onAttachClick}
              title="Attach image or video"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-sm text-slate-600 hover:bg-slate-100"
            >
              <img src="/icon-attachment.png" alt="Attach media" className="h-5 w-5" />
            </button>
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={onMediaSelected}
            />
          </div>
          <button
            type="submit"
            disabled={createPostMutation.isPending}
            className="rounded-full bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-70"
          >
            Post
          </button>
        </form>
        {queuedMedia.length > 0 ? (
          <p className="mt-2 text-xs text-slate-500">{queuedMedia.length} media item(s) attached</p>
        ) : null}
      </section>

      {servicesFeedQuery.isLoading ? <section className="card p-4 text-sm text-slate-600">Loading services feed...</section> : null}
      {servicesFeedQuery.isError ? (
        <section className="card p-4 text-sm text-red-600">{(servicesFeedQuery.error as Error).message}</section>
      ) : null}

      {(servicesFeedQuery.data?.items ?? []).map((post) => (
        <article key={post.id} className="card p-4">
          <header className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">{post.authorName}</p>
            <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString()}</p>
          </header>

          {post.text ? <p className="mb-3 text-sm text-slate-800">{post.text}</p> : null}
          {post.media.length > 0 ? <MediaCarousel media={post.media} /> : null}
        </article>
      ))}
    </div>
  );
}
