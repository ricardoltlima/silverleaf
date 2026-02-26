import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchFeed } from "@/features/feed/feedApi";
import { getGroupAlerts } from "@/features/groups/groupAlerts";
import { getLastSeen, markGroupSeen } from "@/features/groups/groupsStorage";

export function AlertsPage() {
  const navigate = useNavigate();
  const [refreshVersion, setRefreshVersion] = useState(0);

  const groupFeedQuery = useInfiniteQuery({
    queryKey: ["feed", "group", "alerts", "all"],
    queryFn: ({ pageParam }) => fetchFeed(30, "GROUP", undefined, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchInterval: 5000
  });

  useEffect(() => {
    const onSeenChanged = () => setRefreshVersion((current) => current + 1);
    const onPrefsChanged = () => setRefreshVersion((current) => current + 1);
    window.addEventListener("silverleaf-group-seen-changed", onSeenChanged);
    window.addEventListener("silverleaf-group-prefs-changed", onPrefsChanged);
    return () => {
      window.removeEventListener("silverleaf-group-seen-changed", onSeenChanged);
      window.removeEventListener("silverleaf-group-prefs-changed", onPrefsChanged);
    };
  }, []);

  const allPosts = useMemo(
    () => (groupFeedQuery.data?.pages ?? []).flatMap((page) => page.items),
    [groupFeedQuery.data?.pages]
  );

  const alerts = useMemo(() => getGroupAlerts(allPosts), [allPosts, refreshVersion]);
  const unreadCount = alerts.filter((alert) => alert.unread).length;

  const markAllRead = () => {
    const latestByGroup = new Map<string, string>();
    for (const alert of alerts) {
      const slug = alert.groupSlug;
      if (!slug) continue;
      const current = latestByGroup.get(slug);
      if (!current || new Date(alert.createdAt).getTime() > new Date(current).getTime()) {
        latestByGroup.set(slug, alert.createdAt);
      }
    }
    latestByGroup.forEach((timestamp, slug) => markGroupSeen(slug, timestamp));
    setRefreshVersion((current) => current + 1);
  };

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
          Alerts
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">All Groups Activity</h2>
            <p className="mt-1 text-sm text-slate-600">
              New posts from groups you follow, with read/unread status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-600 px-2 py-1 text-xs font-semibold text-white">
              {unreadCount} new
            </span>
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Mark all as read
            </button>
          </div>
        </div>
      </section>

      {groupFeedQuery.isLoading ? <section className="card p-4 text-sm text-slate-600">Loading alerts...</section> : null}
      {groupFeedQuery.isError ? (
        <section className="card p-4 text-sm text-red-600">{(groupFeedQuery.error as Error).message}</section>
      ) : null}

      {alerts.length === 0 ? (
        <section className="card p-4 text-sm text-slate-600">No group activity for your followed groups.</section>
      ) : (
        alerts.map((alert) => (
          <button
            key={`alert-${alert.id}`}
            type="button"
            onClick={() => {
              if (alert.groupSlug) {
                const seenAt = getLastSeen()[alert.groupSlug];
                if (!seenAt || new Date(alert.createdAt).getTime() > new Date(seenAt).getTime()) {
                  markGroupSeen(alert.groupSlug, alert.createdAt);
                }
                navigate(`/groups?group=${encodeURIComponent(alert.groupSlug)}`);
              }
            }}
            className={`card block w-full p-4 text-left transition hover:bg-slate-50 ${
              alert.unread ? "border-rose-200 bg-rose-50/40" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">{alert.groupName}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  alert.unread ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {alert.unread ? "NEW" : "READ"}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900">{alert.authorName} posted a new message</p>
            <p className="mt-1 line-clamp-2 text-sm text-slate-700">{alert.text || "Media post"}</p>
            <p className="mt-2 text-xs text-slate-500">{new Date(alert.createdAt).toLocaleString()}</p>
          </button>
        ))
      )}

      {groupFeedQuery.hasNextPage ? (
        <section className="flex justify-center">
          <button
            type="button"
            onClick={() => groupFeedQuery.fetchNextPage()}
            disabled={groupFeedQuery.isFetchingNextPage}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-70"
          >
            {groupFeedQuery.isFetchingNextPage ? "Loading..." : "Load more activity"}
          </button>
        </section>
      ) : null}
    </div>
  );
}
