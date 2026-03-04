import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteReportedComment,
  deleteReportedPost,
  fetchReportedPosts,
  type FeedModerationReport
} from "@/features/feed/feedApi";
import { MediaCarousel } from "@/features/layout/MediaCarousel";
import { markReportsSeen } from "@/features/board/reportsStorage";

export function BoardReportsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reportsQuery = useQuery({
    queryKey: ["feed", "reports"],
    queryFn: fetchReportedPosts
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => deleteReportedPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed", "reports"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    }
  });
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => deleteReportedComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed", "reports"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    }
  });

  const sortedReports = useMemo(
    () => [...(reportsQuery.data ?? [])].sort((a, b) => Date.parse(b.latestReportedAt) - Date.parse(a.latestReportedAt)),
    [reportsQuery.data]
  );

  useEffect(() => {
    if (!reportsQuery.isLoading) {
      markReportsSeen();
    }
  }, [reportsQuery.isLoading, sortedReports.length]);

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          HOA Reports
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Reports</h2>
        <p className="mt-1 text-sm text-slate-600">
          Review feed posts and comments reported by residents, remove them when needed, or message the author about improper behavior.
        </p>
      </section>

      <section className="card p-4">
        <h3 className="mb-2 text-base font-semibold text-slate-900">Reported content</h3>
        {reportsQuery.isLoading ? <p className="text-sm text-slate-500">Loading reports...</p> : null}
        {reportsQuery.isError ? (
          <p className="text-sm text-rose-700">{(reportsQuery.error as Error).message}</p>
        ) : null}
        {!reportsQuery.isLoading && !reportsQuery.isError && sortedReports.length === 0 ? (
          <p className="text-sm text-slate-500">No reported posts or comments.</p>
        ) : null}
        <div className="space-y-3">
          {sortedReports.map((item) => (
            <article key={`${item.targetType}-${item.commentId ?? item.postId}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <ReportAuthorAvatar name={item.authorName} photoUrl={item.authorPhotoUrl} />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.authorName}</p>
                    <p className="text-xs text-slate-500">
                      {targetLabel(item)} in {feedLocationLabel(item)} · posted {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                  {item.reportCount} report{item.reportCount === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mb-2 text-xs text-slate-500">
                Reported by {item.reporterNames.join(", ")} · latest {new Date(item.latestReportedAt).toLocaleString()}
              </p>
              {item.bodyText ? <p className="mb-3 text-sm text-slate-800">{displayBodyText(item.bodyText)}</p> : null}
              {item.targetType === "POST" && item.media.length > 0 ? <MediaCarousel media={item.media} /> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate(feedTargetForReport(item))}
                  className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                >
                  Open in feed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("silverleaf-open-messages", { detail: item.authorUserId }));
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Message author
                </button>
                {item.targetType === "POST" ? (
                  <button
                    type="button"
                    disabled={deletePostMutation.isPending}
                    onClick={() => deletePostMutation.mutate(item.postId)}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    Delete post
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={deleteCommentMutation.isPending || item.commentId == null}
                    onClick={() => item.commentId && deleteCommentMutation.mutate(item.commentId)}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    Replace comment
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function targetLabel(item: FeedModerationReport) {
  return item.targetType === "COMMENT" ? "Comment" : "Post";
}

function feedLocationLabel(item: FeedModerationReport) {
  if (item.channel === "GROUP") {
    return item.groupSlug ? `Group: ${item.groupSlug}` : "Group";
  }
  if (item.channel === "SERVICES") {
    return "Services";
  }
  return "Community";
}

function feedTargetForReport(item: FeedModerationReport) {
  const commentQuery = item.commentId ? `&commentId=${item.commentId}` : "";
  if (item.channel === "GROUP" && item.groupSlug) {
    return `/groups?group=${encodeURIComponent(item.groupSlug)}&postId=${item.postId}${commentQuery}`;
  }
  if (item.channel === "SERVICES") {
    return `/services?postId=${item.postId}${commentQuery}`;
  }
  return `/community?postId=${item.postId}${commentQuery}`;
}

function ReportAuthorAvatar(props: { name: string; photoUrl: string | null }) {
  const initials = props.name
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
        className="h-11 w-11 rounded-full border border-slate-200 object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-slate-200 to-slate-300 text-xs font-semibold text-slate-700 shadow-sm">
      {initials || "U"}
    </div>
  );
}

function displayBodyText(bodyText: string) {
  return bodyText.replace(/^\[\[reply:\d+]]\s*/, "");
}
