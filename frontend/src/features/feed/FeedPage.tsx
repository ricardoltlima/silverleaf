import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addComment, clearCommentReaction, clearReaction, createFeedPost, fetchFeed, reactToComment, reactToPost, uploadFeedMedia } from "@/features/feed/feedApi";
import type { FeedComment, FeedCommentReactionResponse, FeedLikeResponse, FeedMedia, FeedPageResponse, FeedPost, FeedReactionType } from "@/features/feed/types";
import { getAccessToken } from "@/lib/authStorage";
import { fetchCurrentUser } from "@/features/users/currentUserApi";
import { MediaCarousel } from "@/features/layout/MediaCarousel";

type FeedPageProps = {
  channel?: "COMMUNITY" | "SERVICES" | "GROUP";
  groupSlug?: string;
  allowedGroupSlugs?: string[];
  groupOptions?: Array<{ slug: string; name: string }>;
  composerPlaceholder?: string;
};

type FeedReplyCreatedEvent = {
  postId: number;
  comment: FeedComment;
};

const REPLY_MARKER_REGEX = /^\[\[reply:(\d+)]]\s*/;

export function FeedPage({
  channel = "COMMUNITY",
  groupSlug,
  allowedGroupSlugs,
  groupOptions,
  composerPlaceholder = "Share something with your neighbors..."
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
  const [currentUserPhoto, setCurrentUserPhoto] = useState<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser
  });

  useEffect(() => {
    if (meQuery.data?.photoUrl !== undefined) {
      setCurrentUserPhoto(meQuery.data.photoUrl);
    }
  }, [meQuery.data?.photoUrl]);

  const feedQuery = useQuery({
    queryKey: feedQueryKey,
    queryFn: () => fetchFeed(25, channel, groupSlug),
    staleTime: Infinity
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
              comments: [...post.comments, comment],
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

  const createPostMutation = useMutation({
    mutationFn: createFeedPost,
    onSuccess: (post) => {
      setPostText("");
      setQueuedMedia([]);
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
    mutationFn: uploadFeedMedia
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

    const uploaded: FeedMedia[] = [];
    for (const file of files) {
      const result = await mediaUploadMutation.mutateAsync(file);
      uploaded.push({ type: result.type, url: result.url });
    }
    setQueuedMedia((current) => [...current, ...uploaded]);
    event.target.value = "";
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

      {feedQuery.isLoading ? <section className="card p-4 text-sm text-slate-600">Loading feed...</section> : null}
      {feedQuery.isError ? (
        <section className="card p-4 text-sm text-red-600">{(feedQuery.error as Error).message}</section>
      ) : null}

      {visiblePosts.map((post) => (
        <article key={post.id} className="card p-4">
          <header className="mb-3 flex items-center gap-3">
            <AvatarCircle
              name={post.authorName}
              photoUrl={resolvePhotoUrl(post.authorPhotoUrl, post.authorUserId, meQuery.data?.id, currentUserPhoto)}
              size="md"
            />
            <div>
              <h3 className="font-semibold text-slate-900">{post.authorName}</h3>
              <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString()}</p>
              {channel === "GROUP" && post.groupSlug ? (
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                  {groupNameBySlug.get(post.groupSlug) || post.groupSlug}
                </p>
              ) : null}
            </div>
          </header>

          {post.text ? <p className="mb-3 text-sm text-slate-800">{post.text}</p> : null}
          {post.media.length > 0 ? <PostMedia media={post.media} /> : null}

          {channel === "SERVICES" && post.authorService ? (
            <section className="mt-3 mb-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Service</p>
              <p className="text-sm font-semibold text-slate-900">
                {post.authorService.title || "Neighbor Service"}
              </p>
              {post.authorService.description ? (
                <p
                  className="mt-1 text-sm text-slate-700"
                  title={post.authorService.description}
                >
                  {post.authorService.description.length > 160
                    ? `${post.authorService.description.slice(0, 160)}...`
                    : post.authorService.description}
                </p>
              ) : null}
              <div className="mt-2 grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
                {post.authorService.contactPhone ? <p>Contact: {post.authorService.contactPhone}</p> : null}
                {post.authorService.contactEmail ? <p>Email: {post.authorService.contactEmail}</p> : null}
                {post.authorService.hours ? <p>Hours: {post.authorService.hours}</p> : null}
                {post.authorService.serviceArea ? <p>Area: {post.authorService.serviceArea}</p> : null}
              </div>
              {post.authorService.businessUrl ? (
                <a
                  href={post.authorService.businessUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-emerald-700 underline hover:text-emerald-800"
                >
                  Business page
                </a>
              ) : null}
            </section>
          ) : null}

          <div className="mb-3 flex flex-wrap items-center gap-2 border-y border-slate-200 py-2">
            <ReactionButton
              active={post.viewerReaction === "HEART"}
              label="Thumbs up"
              emoji="👍"
              count={post.reactionCounts?.HEART ?? 0}
              onClick={() => submitReaction(post, "HEART")}
            />
            <ReactionButton
              active={post.viewerReaction === "CLAP"}
              label="Thumbs down"
              emoji="👎"
              count={post.reactionCounts?.CLAP ?? 0}
              onClick={() => submitReaction(post, "CLAP")}
            />
            <ReactionButton
              active={post.viewerReaction === "OK"}
              label="Report"
              emoji="🚩"
              count={post.reactionCounts?.OK ?? 0}
              onClick={() => submitReaction(post, "OK")}
            />
            <span className="ml-auto text-xs text-slate-500">{post.likesCount} total reactions</span>
          </div>

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
          currentUserId={meQuery.data?.id}
          currentUserPhoto={currentUserPhoto}
          draft={commentDrafts[activeCommentsPost.id] ?? ""}
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
          onClose={() => setActiveCommentsPostId(null)}
        />
      ) : null}
    </div>
  );
}

function CommentsModal(props: {
  post: FeedPost;
  currentUserId: number | undefined;
  currentUserPhoto: string | null;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (text: string) => void;
  onSubmitWithReply: (text: string, replyTarget: FeedComment) => void;
  onReactToComment: (commentId: number, reaction: FeedReactionType, clear: boolean) => void;
  onClose: () => void;
}) {
  const [replyTarget, setReplyTarget] = useState<FeedComment | null>(null);
  const commentById = useMemo(
    () => new Map(props.post.comments.map((comment) => [comment.id, comment])),
    [props.post.comments]
  );
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
          <h3 className="text-base font-semibold text-slate-900">
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
          <div className="space-y-2">
            {props.post.comments.length === 0 ? (
              <p className="text-sm text-slate-500">No comments yet.</p>
            ) : (
              props.post.comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
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
                      <p className="text-xs font-semibold text-slate-700">{comment.authorName}</p>
                      <CommentBody
                        comment={comment}
                        commentById={commentById}
                        currentUserId={props.currentUserId}
                        currentUserPhoto={props.currentUserPhoto}
                      />
                      <button
                        type="button"
                        onClick={() => setReplyTarget(comment)}
                        className="mt-1 text-xs font-medium text-leaf-700 hover:underline"
                      >
                        Reply
                      </button>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <ReactionButton
                          active={comment.viewerReaction === "HEART"}
                          label="Thumbs up"
                          emoji="👍"
                          count={comment.reactionCounts?.HEART ?? 0}
                          onClick={() =>
                            props.onReactToComment(comment.id, "HEART", comment.viewerReaction === "HEART")
                          }
                        />
                        <ReactionButton
                          active={comment.viewerReaction === "CLAP"}
                          label="Thumbs down"
                          emoji="👎"
                          count={comment.reactionCounts?.CLAP ?? 0}
                          onClick={() =>
                            props.onReactToComment(comment.id, "CLAP", comment.viewerReaction === "CLAP")
                          }
                        />
                        <ReactionButton
                          active={comment.viewerReaction === "OK"}
                          label="Report"
                          emoji="🚩"
                          count={comment.reactionCounts?.OK ?? 0}
                          onClick={() =>
                            props.onReactToComment(comment.id, "OK", comment.viewerReaction === "OK")
                          }
                        />
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
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-leaf-800">
                    Replying to {replyTarget.authorName}
                  </p>
                  <p className="truncate text-xs text-slate-700">{replyTarget.text}</p>
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
              <p className="text-[11px] font-semibold text-slate-600">{repliedComment.authorName}</p>
              <p className="truncate text-xs text-slate-600">{repliedDecoded?.bodyText ?? repliedComment.text}</p>
            </div>
          </div>
        </div>
      ) : null}
      <p className="text-sm text-slate-800">{decoded.bodyText}</p>
    </div>
  );
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
  emoji: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        props.active
          ? "border-leaf-600 bg-leaf-50 text-leaf-900"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
      title={props.label}
    >
      {props.emoji} {props.count}
    </button>
  );
}

