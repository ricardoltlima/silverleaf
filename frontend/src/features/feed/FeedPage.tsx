import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addComment,
  clearCommentReaction,
  clearReaction,
  createFeedPost,
  deleteComment,
  deletePost,
  fetchFeed,
  reactToComment,
  reactToPost,
  reportComment,
  reportPost,
  updateComment,
  updateFeedPost,
  uploadFeedMedia
} from "@/features/feed/feedApi";
import type { FeedComment, FeedCommentReactionResponse, FeedLikeResponse, FeedMedia, FeedPageResponse, FeedPost, FeedReactionType } from "@/features/feed/types";
import { getAccessToken, getActiveCommunity } from "@/lib/authStorage";
import {
  getReportedCommentIds,
  getReportedPostIds,
  markCommentReported,
  markPostReported
} from "@/features/feed/reportedPostsStorage";
import { fetchCurrentUser } from "@/features/users/currentUserApi";
import { canManageCommunity } from "@/features/users/roleUtils";
import { MediaCarousel } from "@/features/layout/MediaCarousel";

type FeedPageProps = {
  channel?: "COMMUNITY" | "SERVICES" | "GROUP";
  groupSlug?: string;
  allowedGroupSlugs?: string[];
  groupOptions?: Array<{ slug: string; name: string }>;
  composerPlaceholder?: string;
  focusedPostId?: number | null;
  focusedCommentId?: number | null;
};

type FeedReplyCreatedEvent = {
  postId: number;
  comment: FeedComment;
};

const REPLY_MARKER_REGEX = /^\[\[reply:(\d+)]]\s*/;
const REACTION_OPTIONS: Array<{
  type: FeedReactionType;
  label: string;
  icon: "heart" | "thumb-up" | "thumb-down";
}> = [
  { type: "HEART", label: "Heart", icon: "heart" },
  { type: "CLAP", label: "Thumbs up", icon: "thumb-up" },
  { type: "OK", label: "Thumbs down", icon: "thumb-down" }
];

export function FeedPage({
  channel = "COMMUNITY",
  groupSlug,
  allowedGroupSlugs,
  groupOptions,
  composerPlaceholder = "Share something with your neighbors...",
  focusedPostId = null,
  focusedCommentId = null
}: FeedPageProps) {
  const queryClient = useQueryClient();
  const feedQueryKey = useMemo(() => ["feed", channel.toLowerCase(), groupSlug || "all"], [channel, groupSlug]);
  const groupNameBySlug = useMemo(
    () => new Map((groupOptions ?? []).map((group) => [group.slug, group.name])),
    [groupOptions]
  );
  const [selectedComposerGroupSlug, setSelectedComposerGroupSlug] = useState<string | null>(
    groupSlug || groupOptions?.[0]?.slug || null
  );
  const [postText, setPostText] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<number | null>(null);
  const [queuedMedia, setQueuedMedia] = useState<FeedMedia[]>([]);
  const [mediaUploadError, setMediaUploadError] = useState<string>("");
  const [pendingUploads, setPendingUploads] = useState(0);
  const [currentUserPhoto, setCurrentUserPhoto] = useState<string | null>(null);
  const [reportedPostIds, setReportedPostIds] = useState<number[]>([]);
  const [reportedCommentIds, setReportedCommentIds] = useState<number[]>([]);
  const [highlightedPostId, setHighlightedPostId] = useState<number | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingPostText, setEditingPostText] = useState("");
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const postElementRefs = useRef<Record<number, HTMLElement | null>>({});
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser
  });
  const canManageFeed = canManageCommunity(meQuery.data);

  useEffect(() => {
    if (meQuery.data?.photoUrl !== undefined) {
      setCurrentUserPhoto(meQuery.data.photoUrl);
    }
  }, [meQuery.data?.photoUrl]);

  useEffect(() => {
    setReportedPostIds(getReportedPostIds(meQuery.data?.id, getActiveCommunity()?.id));
    setReportedCommentIds(getReportedCommentIds(meQuery.data?.id, getActiveCommunity()?.id));
  }, [meQuery.data?.id]);

  const feedQuery = useQuery({
    queryKey: feedQueryKey,
    queryFn: () => fetchFeed(25, channel, groupSlug),
    staleTime: 0,
    refetchInterval: 5000
  });

  const posts = useMemo(() => feedQuery.data?.items ?? [], [feedQuery.data]);
  const visiblePosts = useMemo(() => {
    if (channel !== "GROUP" || !allowedGroupSlugs || allowedGroupSlugs.length === 0) {
      return posts;
    }
    const allowed = new Set(allowedGroupSlugs);
    return posts.filter((post) => !!post.groupSlug && allowed.has(post.groupSlug));
  }, [allowedGroupSlugs, channel, posts]);
  const activeCommentsPost = useMemo(
    () => visiblePosts.find((post) => post.id === activeCommentsPostId) ?? null,
    [visiblePosts, activeCommentsPostId]
  );

  const appendComment = useCallback(
    (postId: number, comment: FeedComment) => {
      queryClient.setQueryData<FeedPageResponse>(feedQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map((post) => {
            if (post.id !== postId) return post;
            if (post.comments.some((entry) => entry.id === comment.id)) {
              return post;
            }
            return {
              ...post,
              comments: [...post.comments, { ...comment, postId }],
              commentsCount: post.commentsCount + 1
            };
          })
        };
      });
    },
    [feedQueryKey, queryClient]
  );

  const applyReactionUpdate = useCallback(
    (postId: number, response: FeedLikeResponse) => {
      queryClient.setQueryData<FeedPageResponse>(feedQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map((post) =>
            post.id !== postId
              ? post
              : {
                  ...post,
                  likesCount: response.likesCount,
                  reactionCounts: response.reactionCounts,
                  viewerReaction: response.viewerReaction
                }
          )
        };
      });
    },
    [feedQueryKey, queryClient]
  );

  const replacePost = useCallback(
    (updatedPost: FeedPost) => {
      queryClient.setQueryData<FeedPageResponse>(feedQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map((post) => (post.id === updatedPost.id ? updatedPost : post))
        };
      });
    },
    [feedQueryKey, queryClient]
  );

  const replaceComment = useCallback(
    (postId: number, updatedComment: FeedComment) => {
      queryClient.setQueryData<FeedPageResponse>(feedQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map((post) =>
            post.id !== postId
              ? post
              : {
                  ...post,
                  comments: post.comments.map((comment) =>
                    comment.id === updatedComment.id ? { ...updatedComment, postId } : comment
                  )
                }
          )
        };
      });
    },
    [feedQueryKey, queryClient]
  );

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS("/ws"),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000
    });

    client.onConnect = () => {
      client.subscribe("/topic/feed", (message: { body: string }) => {
        try {
          const event = JSON.parse(message.body) as FeedReplyCreatedEvent;
          if (event?.postId && event?.comment) {
            appendComment(event.postId, event.comment);
          }
        } catch {
          // Ignore malformed socket payloads.
        }
      });
    };

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [appendComment]);

  useEffect(() => {
    const onProfilePhotoChanged = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setCurrentUserPhoto(customEvent.detail || null);
    };
    window.addEventListener("silverleaf-profile-photo-changed", onProfilePhotoChanged);
    return () => {
      window.removeEventListener("silverleaf-profile-photo-changed", onProfilePhotoChanged);
    };
  }, []);

  useEffect(() => {
    if (focusedPostId == null) {
      return;
    }
    const matchingPost = visiblePosts.find((post) => post.id === focusedPostId);
    if (!matchingPost) {
      return;
    }
    const element = postElementRefs.current[focusedPostId];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setHighlightedPostId(focusedPostId);
    const timeout = window.setTimeout(() => setHighlightedPostId((current) => (current === focusedPostId ? null : current)), 3500);
    return () => window.clearTimeout(timeout);
  }, [focusedPostId, visiblePosts]);

  useEffect(() => {
    if (focusedPostId == null || focusedCommentId == null) {
      return;
    }
    const matchingPost = visiblePosts.find((post) => post.id === focusedPostId);
    if (!matchingPost || !matchingPost.comments.some((comment) => comment.id === focusedCommentId)) {
      return;
    }
    setActiveCommentsPostId(focusedPostId);
    setHighlightedCommentId(focusedCommentId);
    const timeout = window.setTimeout(
      () => setHighlightedCommentId((current) => (current === focusedCommentId ? null : current)),
      3500
    );
    return () => window.clearTimeout(timeout);
  }, [focusedCommentId, focusedPostId, visiblePosts]);

  const createPostMutation = useMutation({
    mutationFn: createFeedPost,
    onSuccess: (post) => {
      setPostText("");
      setQueuedMedia([]);
      setMediaUploadError("");
      queryClient.setQueryData<FeedPageResponse>(feedQueryKey, (current) => {
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

  const updatePostMutation = useMutation({
    mutationFn: ({ postId, text }: { postId: number; text: string }) => updateFeedPost(postId, text),
    onSuccess: (updatedPost) => {
      replacePost(updatedPost);
      setEditingPostId(null);
      setEditingPostText("");
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => deletePost(postId),
    onSuccess: (_, postId) => {
      queryClient.setQueryData<FeedPageResponse>(feedQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.filter((post) => post.id !== postId)
        };
      });
      if (activeCommentsPostId === postId) {
        setActiveCommentsPostId(null);
      }
    }
  });

  const reactionMutation = useMutation({
    mutationFn: ({ postId, reaction, clear }: { postId: number; reaction: FeedReactionType; clear: boolean }) =>
      clear ? clearReaction(postId) : reactToPost(postId, reaction),
    onSuccess: (response, args) => applyReactionUpdate(args.postId, response)
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, text }: { postId: number; text: string }) => addComment(postId, text),
    onSuccess: (comment, args) => {
      setCommentDrafts((prev) => ({ ...prev, [args.postId]: "" }));
      appendComment(args.postId, comment);
    }
  });

  const mediaUploadMutation = useMutation({
    mutationFn: (file: File) => uploadFeedMedia(file)
  });

  const commentReactionMutation = useMutation({
    mutationFn: ({
      postId,
      commentId,
      reaction,
      clear
    }: {
      postId: number;
      commentId: number;
      reaction: FeedReactionType;
      clear: boolean;
    }) => (clear ? clearCommentReaction(postId, commentId) : reactToComment(postId, commentId, reaction)),
    onSuccess: (response, args) => {
      queryClient.setQueryData<FeedPageResponse>(feedQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          items: current.items.map((post) =>
            post.id !== args.postId
              ? post
              : {
                  ...post,
                  comments: post.comments.map((comment) =>
                    comment.id !== args.commentId
                      ? comment
                      : {
                          ...comment,
                          likesCount: (response as FeedCommentReactionResponse).likesCount,
                          reactionCounts: (response as FeedCommentReactionResponse).reactionCounts,
                          viewerReaction: (response as FeedCommentReactionResponse).viewerReaction
                        }
                  )
                }
          )
        };
      });
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ postId, commentId, text }: { postId: number; commentId: number; text: string }) =>
      updateComment(postId, commentId, text),
    onSuccess: (updatedComment, args) => {
      replaceComment(args.postId, updatedComment);
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: ({ postId, commentId }: { postId: number; commentId: number }) => deleteComment(postId, commentId),
    onSuccess: (updatedComment, args) => {
      replaceComment(args.postId, updatedComment);
    }
  });

  const reportPostMutation = useMutation({
    mutationFn: (postId: number) => reportPost(postId),
    onMutate: (postId) => {
      markPostReported(meQuery.data?.id, getActiveCommunity()?.id, postId);
      setReportedPostIds((current) => (current.includes(postId) ? current : [...current, postId]));
    },
    onSuccess: (_, postId) => {
      setReportedPostIds((current) => (current.includes(postId) ? current : [...current, postId]));
    }
  });
  const reportCommentMutation = useMutation({
    mutationFn: ({ postId, commentId }: { postId: number; commentId: number }) => reportComment(postId, commentId),
    onMutate: ({ commentId }) => {
      markCommentReported(meQuery.data?.id, getActiveCommunity()?.id, commentId);
      setReportedCommentIds((current) => (current.includes(commentId) ? current : [...current, commentId]));
    },
    onSuccess: (_, { commentId }) => {
      setReportedCommentIds((current) => (current.includes(commentId) ? current : [...current, commentId]));
    }
  });

  const submitPost = (event: FormEvent) => {
    event.preventDefault();
    const text = postText.trim();
    if (!text && queuedMedia.length === 0) return;
    const targetGroupSlug = groupSlug || selectedComposerGroupSlug;
    if (channel === "GROUP" && !targetGroupSlug) return;
    createPostMutation.mutate({ text, media: queuedMedia, channel, groupSlug: targetGroupSlug || undefined });
  };

  const submitReaction = (post: FeedPost, reaction: FeedReactionType) => {
    reactionMutation.mutate({
      postId: post.id,
      reaction,
      clear: post.viewerReaction === reaction
    });
  };

  const submitPostEdit = (postId: number) => {
    const text = editingPostText.trim();
    updatePostMutation.mutate({ postId, text });
  };

  const submitReplyComment = (postId: number, text: string, replyTarget: FeedComment | null) => {
    const normalized = text.trim();
    if (!normalized) return;
    const payload = replyTarget ? `[[reply:${replyTarget.id}]] ${normalized}` : normalized;
    commentMutation.mutate({ postId, text: payload });
  };

  const onAttachClick = () => {
    mediaInputRef.current?.click();
  };

  const onMediaSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setMediaUploadError("");
    setPendingUploads(files.length);
    try {
      const uploaded: FeedMedia[] = [];
      for (const file of files) {
        const result = await mediaUploadMutation.mutateAsync(file);
        uploaded.push({ type: result.type, url: result.url });
      }
      setQueuedMedia((current) => [...current, ...uploaded]);
    } catch (error) {
      setMediaUploadError(error instanceof Error ? error.message : "Unable to upload media");
    } finally {
      setPendingUploads(0);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <form onSubmit={submitPost} className="flex items-center gap-2">
          <div className="relative w-full">
            {channel === "GROUP" && !groupSlug && (groupOptions?.length ?? 0) > 0 ? (
              <select
                value={selectedComposerGroupSlug ?? ""}
                onChange={(event) => setSelectedComposerGroupSlug(event.target.value)}
                className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none ring-leaf-600 focus:ring-2"
              >
                {(groupOptions ?? []).map((option) => (
                  <option key={option.slug} value={option.slug}>
                    Post in: {option.name}
                  </option>
                ))}
              </select>
            ) : null}
            <input
              type="text"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder={composerPlaceholder}
              className="w-full rounded-full border border-slate-300 px-4 py-2 pr-12 outline-none ring-leaf-600 focus:ring-2"
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
            disabled={createPostMutation.isPending || pendingUploads > 0}
            className="rounded-full bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-70"
          >
            Post
          </button>
        </form>
        {queuedMedia.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {queuedMedia.map((item, index) => (
              <button
                key={`${item.url}-${index}`}
                type="button"
                onClick={() => setQueuedMedia((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                {item.type.toLowerCase()} {index + 1} x
              </button>
            ))}
          </div>
        ) : null}
        {pendingUploads > 0 ? (
          <p className="mt-2 text-xs text-slate-500">Uploading {pendingUploads} media item(s)...</p>
        ) : null}
        {mediaUploadError ? <p className="mt-2 text-xs text-red-600">{mediaUploadError}</p> : null}
      </section>

      {feedQuery.isLoading ? <section className="card p-4 text-sm text-slate-600">Loading feed...</section> : null}
      {feedQuery.isError ? (
        <section className="card p-4 text-sm text-red-600">{(feedQuery.error as Error).message}</section>
      ) : null}

      {visiblePosts.map((post) => (
        <article
          key={post.id}
          ref={(element) => {
            postElementRefs.current[post.id] = element;
          }}
          className={`card p-4 transition ${
            highlightedPostId === post.id ? "ring-2 ring-amber-400 ring-offset-2" : ""
          }`}
        >
          <header className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
            <AvatarCircle
              name={post.authorName}
              photoUrl={resolvePhotoUrl(post.authorPhotoUrl, post.authorUserId, meQuery.data?.id, currentUserPhoto)}
              size="md"
            />
            <div>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("silverleaf-open-messages", { detail: post.authorUserId }))
                }
                className="feed-author-name text-left text-slate-900 transition hover:text-leaf-700"
              >
                {post.authorName}
              </button>
              <p className="feed-meta text-slate-500">{new Date(post.createdAt).toLocaleString()}</p>
              {channel === "GROUP" && post.groupSlug ? (
                <p className="feed-meta uppercase tracking-wide text-violet-700">
                  {groupNameBySlug.get(post.groupSlug) || post.groupSlug}
                </p>
              ) : null}
            </div>
            </div>
            {canManageFeed || meQuery.data?.id === post.authorUserId ? (
              <div className="flex items-center gap-1">
                <MiniActionButton
                  label="Edit post"
                  icon="edit"
                  onClick={() => {
                    setEditingPostId(post.id);
                    setEditingPostText(post.text ?? "");
                  }}
                />
                <MiniActionButton
                  label="Delete post"
                  icon="delete"
                  disabled={deletePostMutation.isPending}
                  onClick={() => deletePostMutation.mutate(post.id)}
                />
              </div>
            ) : null}
          </header>

          {editingPostId === post.id ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <textarea
                value={editingPostText}
                onChange={(event) => setEditingPostText(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-amber-500 focus:ring-2"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={updatePostMutation.isPending}
                  onClick={() => submitPostEdit(post.id)}
                  className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPostId(null);
                    setEditingPostText("");
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : post.text ? <p className="feed-post-copy mb-3 text-slate-800">{post.text}</p> : null}
          {post.media.length > 0 ? <PostMedia media={post.media} /> : null}

          {channel === "SERVICES" && post.authorService ? (
            <section className="mt-3 mb-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("silverleaf-open-messages", { detail: post.authorUserId }))
                }
                className="feed-author-name text-left text-slate-900 transition hover:text-leaf-700"
              >
                {post.authorService.title || "Neighbor Service"}
              </button>
              {post.authorService.description ? (
                <p
                  className="feed-post-copy mt-1 text-slate-700"
                  title={post.authorService.description}
                >
                  {post.authorService.description.length > 160
                    ? `${post.authorService.description.slice(0, 160)}...`
                    : post.authorService.description}
                </p>
              ) : null}
              <div className="feed-post-copy mt-2 grid gap-1 text-slate-700">
                {post.authorService.contactEmail ? <p>Email: {post.authorService.contactEmail}</p> : null}
                {post.authorService.contactPhone ? <p>Contact: {post.authorService.contactPhone}</p> : null}
                {post.authorService.hours ? <p>Hours: {post.authorService.hours}</p> : null}
              </div>
              {post.authorService.businessUrl ? (
                <a
                  href={post.authorService.businessUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="feed-post-copy mt-2 inline-block text-emerald-700 underline hover:text-emerald-800"
                >
                  Business page
                </a>
              ) : null}
            </section>
          ) : null}

          <div className="mb-3 flex flex-wrap items-center gap-2 border-y border-slate-200 py-2">
            {REACTION_OPTIONS.map((reaction) => (
              <ReactionButton
                key={`${post.id}-${reaction.type}`}
                active={post.viewerReaction === reaction.type}
                label={reaction.label}
                icon={reaction.icon}
                count={post.reactionCounts?.[reaction.type] ?? 0}
                disabled={reactionMutation.isPending && reactionMutation.variables?.postId === post.id}
                onClick={() => submitReaction(post, reaction.type)}
              />
            ))}
            <ActionIconButton
              label="Report"
              active={reportedPostIds.includes(post.id)}
              icon="report"
              disabled={reportPostMutation.isPending && reportPostMutation.variables === post.id}
              onClick={() => reportPostMutation.mutate(post.id)}
            />
            <span className="feed-meta ml-auto text-slate-500">{post.likesCount} total reactions</span>
          </div>
          {reportPostMutation.isSuccess && reportPostMutation.variables === post.id ? (
            <p className="mb-3 text-xs font-medium text-amber-700">Post reported to HOA.</p>
          ) : null}

          <button
            type="button"
            onClick={() => setActiveCommentsPostId(post.id)}
            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Comments ({post.commentsCount})
          </button>
        </article>
      ))}

      {activeCommentsPost ? (
        <CommentsModal
          post={activeCommentsPost}
          canManageFeed={canManageFeed}
          currentUserId={meQuery.data?.id}
          currentUserPhoto={currentUserPhoto}
          draft={commentDrafts[activeCommentsPost.id] ?? ""}
          commentReactionPendingId={
            commentReactionMutation.isPending ? commentReactionMutation.variables?.commentId ?? null : null
          }
          commentReportPendingId={
            reportCommentMutation.isPending ? reportCommentMutation.variables?.commentId ?? null : null
          }
          highlightedCommentId={highlightedCommentId}
          reportedCommentIds={reportedCommentIds}
          onDraftChange={(value) =>
            setCommentDrafts((prev) => ({
              ...prev,
              [activeCommentsPost.id]: value
            }))
          }
          onSubmit={(text) => submitReplyComment(activeCommentsPost.id, text, null)}
          onSubmitWithReply={(text, replyTarget) =>
            submitReplyComment(activeCommentsPost.id, text, replyTarget)
          }
          onReactToComment={(commentId, reaction, clear) =>
            commentReactionMutation.mutate({
              postId: activeCommentsPost.id,
              commentId,
              reaction,
              clear
            })
          }
          onReportComment={(commentId) =>
            reportCommentMutation.mutate({
              postId: activeCommentsPost.id,
              commentId
            })
          }
          onUpdateComment={(commentId, text) =>
            updateCommentMutation.mutate({
              postId: activeCommentsPost.id,
              commentId,
              text
            })
          }
          onDeleteComment={(commentId) =>
            deleteCommentMutation.mutate({
              postId: activeCommentsPost.id,
              commentId
            })
          }
          onClose={() => setActiveCommentsPostId(null)}
        />
      ) : null}
    </div>
  );
}

function CommentsModal(props: {
  post: FeedPost;
  canManageFeed: boolean;
  currentUserId: number | undefined;
  currentUserPhoto: string | null;
  draft: string;
  commentReactionPendingId: number | null;
  commentReportPendingId: number | null;
  highlightedCommentId: number | null;
  reportedCommentIds: number[];
  onDraftChange: (value: string) => void;
  onSubmit: (text: string) => void;
  onSubmitWithReply: (text: string, replyTarget: FeedComment) => void;
  onReactToComment: (commentId: number, reaction: FeedReactionType, clear: boolean) => void;
  onReportComment: (commentId: number) => void;
  onUpdateComment: (commentId: number, text: string) => void;
  onDeleteComment: (commentId: number) => void;
  onClose: () => void;
}) {
  const [replyTarget, setReplyTarget] = useState<FeedComment | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const commentById = useMemo(
    () => new Map(props.post.comments.map((comment) => [comment.id, comment])),
    [props.post.comments]
  );

  useEffect(() => {
    if (replyTarget && !commentById.has(replyTarget.id)) {
      setReplyTarget(null);
    }
  }, [commentById, replyTarget]);

  useEffect(() => {
    if (editingCommentId && !commentById.has(editingCommentId)) {
      setEditingCommentId(null);
      setEditingCommentText("");
    }
  }, [commentById, editingCommentId]);

  const onComposerSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = props.draft.trim();
    if (!text) return;
    if (replyTarget) {
      props.onSubmitWithReply(text, replyTarget);
    } else {
      props.onSubmit(text);
    }
    props.onDraftChange("");
    setReplyTarget(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      onClick={props.onClose}
    >
      <div
        className="flex h-[82vh] w-[min(760px,96vw)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="app-section-title text-slate-900">
            Comments ({props.post.commentsCount})
          </h3>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center gap-3">
                <AvatarCircle
                  name={props.post.authorName}
                  photoUrl={resolvePhotoUrl(
                    props.post.authorPhotoUrl,
                    props.post.authorUserId,
                    props.currentUserId,
                    props.currentUserPhoto
                  )}
                  size="md"
                />
                <div>
                  <p className="comment-meta font-semibold text-slate-900">{props.post.authorName}</p>
                  <p className="comment-meta text-slate-500">{new Date(props.post.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {props.post.text ? <p className="comment-copy mb-3 text-slate-800">{props.post.text}</p> : null}
              {props.post.media.length > 0 ? <PostMedia media={props.post.media} /> : null}
            </section>
            {props.post.comments.length === 0 ? (
              <p className="text-sm text-slate-500">No comments yet.</p>
            ) : (
              props.post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`rounded-lg border px-3 py-2 transition ${
                    props.highlightedCommentId === comment.id
                      ? "border-amber-300 bg-amber-50/70 ring-2 ring-amber-200"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AvatarCircle
                      name={comment.authorName}
                      photoUrl={resolvePhotoUrl(
                        comment.authorPhotoUrl,
                        comment.authorUserId,
                        props.currentUserId,
                        props.currentUserPhoto
                      )}
                      size="sm"
                    />
                    <div>
                      <p className="comment-meta font-semibold text-slate-700">{comment.authorName}</p>
                      {editingCommentId === comment.id ? (
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/70 p-2">
                          <textarea
                            value={editingCommentText}
                            onChange={(event) => setEditingCommentText(event.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-amber-500 focus:ring-2"
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const updatedText = rebuildReplyText(comment.text, editingCommentText);
                                props.onUpdateComment(comment.id, updatedText);
                                setEditingCommentId(null);
                                setEditingCommentText("");
                              }}
                              className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditingCommentText("");
                              }}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <CommentBody
                          comment={comment}
                          commentById={commentById}
                          currentUserId={props.currentUserId}
                          currentUserPhoto={props.currentUserPhoto}
                        />
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setReplyTarget(comment)}
                          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Reply
                        </button>
                        {REACTION_OPTIONS.map((reaction) => (
                          <ReactionButton
                            key={`${comment.id}-${reaction.type}`}
                            active={comment.viewerReaction === reaction.type}
                            label={reaction.label}
                            icon={reaction.icon}
                            count={comment.reactionCounts?.[reaction.type] ?? 0}
                            disabled={props.commentReactionPendingId === comment.id}
                            onClick={() =>
                              props.onReactToComment(
                                comment.id,
                                reaction.type,
                                comment.viewerReaction === reaction.type
                              )
                            }
                          />
                        ))}
                        <ActionIconButton
                          label="Report comment"
                          active={props.reportedCommentIds.includes(comment.id)}
                          icon="report"
                          disabled={props.commentReportPendingId === comment.id}
                          onClick={() => props.onReportComment(comment.id)}
                        />
                        {props.canManageFeed || props.currentUserId === comment.authorUserId ? (
                          <>
                            <MiniActionButton
                              label="Edit comment"
                              icon="edit"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentText(commentPreviewText(comment));
                              }}
                            />
                            <MiniActionButton
                              label="Delete comment"
                              icon="delete"
                              onClick={() => props.onDeleteComment(comment.id)}
                            />
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <form onSubmit={onComposerSubmit} className="border-t border-slate-200 p-3">
          {replyTarget ? (
            <div className="mb-2 rounded-lg border border-leaf-200 bg-leaf-50 px-2 py-2">
              <div className="flex items-start gap-2">
                <AvatarCircle
                  name={replyTarget.authorName}
                  photoUrl={resolvePhotoUrl(
                    replyTarget.authorPhotoUrl,
                    replyTarget.authorUserId,
                    props.currentUserId,
                    props.currentUserPhoto
                  )}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="comment-meta font-semibold uppercase tracking-wide text-leaf-800">
                    Replying to {replyTarget.authorName}
                  </p>
                  <p className="comment-meta truncate text-slate-700">{commentPreviewText(replyTarget)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="rounded border border-slate-300 px-1 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
                >
                  x
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={props.draft}
              onChange={(event) => props.onDraftChange(event.target.value)}
              placeholder="Write a reply..."
              className="w-full rounded-full border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
            />
            <button
              type="submit"
              className="rounded-full border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Reply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function decodeReplyText(rawText: string): { repliedCommentId: number | null; bodyText: string } {
  const match = rawText.match(REPLY_MARKER_REGEX);
  if (!match) {
    return { repliedCommentId: null, bodyText: rawText };
  }
  return {
    repliedCommentId: Number(match[1]),
    bodyText: rawText.replace(REPLY_MARKER_REGEX, "")
  };
}

function CommentBody(props: {
  comment: FeedComment;
  commentById: Map<number, FeedComment>;
  currentUserId: number | undefined;
  currentUserPhoto: string | null;
}) {
  const decoded = decodeReplyText(props.comment.text);
  const repliedComment = decoded.repliedCommentId == null ? null : props.commentById.get(decoded.repliedCommentId) ?? null;
  const repliedDecoded = repliedComment ? decodeReplyText(repliedComment.text) : null;

  return (
    <div className="space-y-1">
      {repliedComment ? (
        <div className="rounded-md border border-slate-200 bg-white/80 px-2 py-1">
          <div className="flex items-start gap-2">
            <AvatarCircle
              name={repliedComment.authorName}
              photoUrl={resolvePhotoUrl(
                repliedComment.authorPhotoUrl,
                repliedComment.authorUserId,
                props.currentUserId,
                props.currentUserPhoto
              )}
              size="sm"
            />
            <div className="min-w-0">
              <p className="comment-meta font-semibold text-slate-600">{repliedComment.authorName}</p>
              <p className="comment-meta truncate text-slate-600">{repliedDecoded?.bodyText ?? repliedComment.text}</p>
            </div>
          </div>
        </div>
      ) : null}
      <p className="comment-copy text-slate-800">{decoded.bodyText}</p>
    </div>
  );
}

function commentPreviewText(comment: FeedComment): string {
  return decodeReplyText(comment.text).bodyText;
}

function rebuildReplyText(existingRawText: string, nextVisibleText: string) {
  const match = existingRawText.match(REPLY_MARKER_REGEX);
  const cleanedText = nextVisibleText.trim();
  if (!match) {
    return cleanedText;
  }
  return `[[reply:${match[1]}]] ${cleanedText}`;
}

function AvatarCircle(props: { name: string; photoUrl?: string | null; size: "sm" | "md" }) {
  const sizeClass = props.size === "md" ? "h-10 w-10" : "h-7 w-7";
  const initials = String(props.name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  if (props.photoUrl) {
    return (
      <img
        src={props.photoUrl}
        alt={`${props.name} avatar`}
        className={`${sizeClass} rounded-full border border-slate-200 object-cover shadow-sm`}
      />
    );
  }

  return (
    <div
      title="Unknown photo"
      className={`${sizeClass} flex items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-slate-200 to-slate-300 text-[10px] font-semibold text-slate-700 shadow-sm`}
    >
      {initials || "U"}
    </div>
  );
}

function resolvePhotoUrl(
  apiPhotoUrl: string | null | undefined,
  authorUserId: number,
  currentUserId: number | undefined,
  currentUserPhoto: string | null
): string | null {
  if (apiPhotoUrl) {
    return apiPhotoUrl;
  }
  if (currentUserId && authorUserId === currentUserId) {
    return currentUserPhoto;
  }
  return null;
}

function PostMedia({ media }: { media: FeedMedia[] }) {
  return <MediaCarousel media={media} />;
}

function ReactionButton(props: {
  active: boolean;
  label: string;
  icon: "heart" | "thumb-up" | "thumb-down";
  count: number;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium shadow-sm transition hover:-translate-y-0.5 ${
        props.active
          ? activeReactionClass(props.icon)
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      } disabled:cursor-not-allowed disabled:opacity-60`}
      title={props.label}
      aria-label={props.label}
    >
      <ReactionIcon type={props.icon} />
      <span>{props.count}</span>
    </button>
  );
}

function ReactionIcon(props: { type: "heart" | "thumb-up" | "thumb-down" }) {
  if (props.type === "heart") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M10 17.2 3.5 10.9a4.4 4.4 0 0 1 6.2-6.3L10 5l.3-.4a4.4 4.4 0 1 1 6.2 6.3L10 17.2Z" />
      </svg>
    );
  }
  if (props.type === "thumb-up") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M8.6 2.5a1 1 0 0 1 1 .9v2.8l1.9-.1c1.6-.1 2.6 1.7 1.7 3.1l-1.1 1.8h3.4c1.2 0 2 .9 1.8 2l-.6 3.5A2 2 0 0 1 14.7 18H7a2 2 0 0 1-2-2V9.5c0-.4.1-.8.4-1.1l2.6-2.9c.4-.4.6-1 .6-1.6V3.5a1 1 0 0 1 1-1Z" />
        <path d="M2 9h2v9H2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M11.4 17.5a1 1 0 0 1-1-.9v-2.8l-1.9.1c-1.6.1-2.6-1.7-1.7-3.1l1.1-1.8H4.5c-1.2 0-2-.9-1.8-2l.6-3.5A2 2 0 0 1 5.3 2h7.7a2 2 0 0 1 2 2v6.5c0 .4-.1.8-.4 1.1L12 14.5c-.4.4-.6 1-.6 1.6v.4a1 1 0 0 1-1 1Z" />
      <path d="M16 2h2v9h-2z" />
    </svg>
  );
}

function ActionIconButton(props: {
  label: string;
  icon: "report";
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
        props.active
          ? "border-rose-300 bg-gradient-to-r from-rose-100 to-red-100 text-rose-700"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
      title={props.label}
      aria-label={props.label}
    >
      <ActionIcon type={props.icon} />
    </button>
  );
}

function ActionIcon(props: { type: "report" }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M5 2.4a1 1 0 0 1 1 1V4h7.4l-1.3 2.4L13.4 9H6v7.6a1 1 0 1 1-2 0V3.4a1 1 0 0 1 1-1Z" />
      <circle cx="14.7" cy="4.4" r="1.8" />
    </svg>
  );
}

function MiniActionButton(props: {
  label: string;
  icon: "edit" | "delete";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      title={props.label}
      aria-label={props.label}
    >
      {props.icon === "edit" ? (
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M13.9 2.8a1.7 1.7 0 0 1 2.4 2.4l-8.7 8.7-3.3.8.8-3.3 8.8-8.6Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M7 2.8h6l.5 1.7H17v1.5H3V4.5h3.5L7 2.8Zm-2 4.7h10l-.8 8a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8l-.8-8Z" />
        </svg>
      )}
      <span>{props.label}</span>
    </button>
  );
}

function activeReactionClass(icon: "heart" | "thumb-up" | "thumb-down") {
  if (icon === "heart") {
    return "border-rose-300 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700";
  }
  if (icon === "thumb-up") {
    return "border-emerald-300 bg-gradient-to-r from-emerald-100 to-lime-100 text-emerald-700";
  }
  return "border-amber-300 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800";
}

