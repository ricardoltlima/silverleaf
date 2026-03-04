import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchReactionAlerts, markReactionAlertsRead } from "@/features/alerts/alertsApi";
import { fetchFeed } from "@/features/feed/feedApi";
import { getGroupAlerts } from "@/features/groups/groupAlerts";
import { getLastSeen, markGroupSeen } from "@/features/groups/groupsStorage";
import { getLastSeenGroupRequestsAt, markGroupRequestsSeen } from "@/features/groups/groupRequestsStorage";
import { approveGroupRequest, fetchGroupRequests, rejectGroupRequest } from "@/features/groups/groupsApi";
import { fetchAllViolations, fetchBroadcasts, fetchPolls, votePoll } from "@/features/board/boardApi";
import { getLastSeenViolationsAt, markViolationsSeen } from "@/features/board/violationsStorage";
import { fetchCurrentUser } from "@/features/users/currentUserApi";
import { canManageCommunity, canVoteInHoaPolls } from "@/features/users/roleUtils";

export function AlertsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchCurrentUser });
  const isAdmin = canManageCommunity(meQuery.data);
  const canVote = canVoteInHoaPolls(meQuery.data?.role);

  const broadcastsQuery = useQuery({ queryKey: ["alerts", "broadcasts"], queryFn: fetchBroadcasts });
  const pollsQuery = useQuery({ queryKey: ["alerts", "polls"], queryFn: fetchPolls });
  const reactionAlertsQuery = useQuery({
    queryKey: ["alerts", "reactions"],
    queryFn: fetchReactionAlerts,
    refetchInterval: 5000
  });
  const groupRequestsQuery = useQuery({
    queryKey: ["alerts", "group-requests"],
    queryFn: fetchGroupRequests,
    refetchInterval: 5000
  });
  const violationsQuery = useQuery({
    queryKey: ["alerts", "violations"],
    queryFn: fetchAllViolations,
    enabled: isAdmin,
    refetchInterval: 5000
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionIndex }: { pollId: number; optionIndex: number }) => votePoll(pollId, optionIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", "polls"] });
      queryClient.invalidateQueries({ queryKey: ["board", "polls"] });
    }
  });
  const approveRequestMutation = useMutation({
    mutationFn: approveGroupRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", "group-requests"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", "requests"] });
    }
  });
  const rejectRequestMutation = useMutation({
    mutationFn: rejectGroupRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", "group-requests"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", "requests"] });
    }
  });
  const readReactionAlertsMutation = useMutation({
    mutationFn: markReactionAlertsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", "reactions"] });
    }
  });

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
    const onViolationsSeenChanged = () => setRefreshVersion((current) => current + 1);
    window.addEventListener("silverleaf-group-seen-changed", onSeenChanged);
    window.addEventListener("silverleaf-group-prefs-changed", onPrefsChanged);
    window.addEventListener("silverleaf-violations-seen-changed", onViolationsSeenChanged);
    return () => {
      window.removeEventListener("silverleaf-group-seen-changed", onSeenChanged);
      window.removeEventListener("silverleaf-group-prefs-changed", onPrefsChanged);
      window.removeEventListener("silverleaf-violations-seen-changed", onViolationsSeenChanged);
    };
  }, []);

  const allPosts = useMemo(
    () => (groupFeedQuery.data?.pages ?? []).flatMap((page) => page.items),
    [groupFeedQuery.data?.pages]
  );

  const alerts = useMemo(() => getGroupAlerts(allPosts), [allPosts, refreshVersion]);
  const unreadCount = alerts.filter((alert) => alert.unread).length;
  const reactionAlerts = reactionAlertsQuery.data ?? [];
  const unreadReactionAlertCount = reactionAlerts.filter((alert) => alert.unread).length;
  const groupRequestAlerts = useMemo(() => {
    const lastSeenAt = getLastSeenGroupRequestsAt();
    return (groupRequestsQuery.data ?? []).map((request) => ({
      ...request,
      unread:
        !lastSeenAt || new Date(request.createdAt).getTime() > new Date(lastSeenAt).getTime()
    }));
  }, [groupRequestsQuery.data, refreshVersion]);
  const unreadGroupRequestCount = groupRequestAlerts.filter((request) => request.unread).length;
  const violationAlerts = useMemo(() => {
    const lastSeenAt = getLastSeenViolationsAt();
    return (violationsQuery.data ?? []).map((item) => ({
      ...item,
      unread:
        item.status === "OPEN" &&
        (!lastSeenAt || new Date(item.createdAt).getTime() > new Date(lastSeenAt).getTime())
    }));
  }, [violationsQuery.data, refreshVersion]);
  const unreadViolationCount = violationAlerts.filter((item) => item.unread).length;

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
  const markViolationAlertsRead = () => {
    const latestViolationAt = violationAlerts.reduce<string | null>((current, item) => {
      if (!current) {
        return item.createdAt;
      }
      return new Date(item.createdAt).getTime() > new Date(current).getTime() ? item.createdAt : current;
    }, null);
    if (latestViolationAt) {
      markViolationsSeen(latestViolationAt);
    }
  };
  const markGroupRequestAlertsRead = () => {
    const latestRequestAt = groupRequestAlerts.reduce<string | null>((current, request) => {
      if (!current) {
        return request.createdAt;
      }
      return new Date(request.createdAt).getTime() > new Date(current).getTime() ? request.createdAt : current;
    }, null);
    if (latestRequestAt) {
      markGroupRequestsSeen(latestRequestAt);
      setRefreshVersion((current) => current + 1);
    }
  };

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
          Alerts
        </div>
        <h2 className="app-page-title text-slate-900">Community Alerts</h2>
        <p className="mt-1 text-sm text-slate-600">
          Board announcements, active polls, and activity from groups you follow.
        </p>
      </section>

      <section className="card p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="app-section-title text-slate-900">Post reactions</h3>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-pink-500 px-2 py-1 text-xs font-semibold text-white">
              {unreadReactionAlertCount} new
            </span>
            <button
              type="button"
              onClick={() => readReactionAlertsMutation.mutate()}
              disabled={readReactionAlertsMutation.isPending || unreadReactionAlertCount === 0}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              Mark as read
            </button>
          </div>
        </div>
        {reactionAlertsQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading reaction alerts...</p>
        ) : reactionAlertsQuery.isError ? (
          <p className="text-sm text-rose-700">{(reactionAlertsQuery.error as Error).message}</p>
        ) : reactionAlerts.length ? (
          <div className="space-y-2">
            {reactionAlerts.map((alert) => (
              <button
                key={`reaction-alert-${alert.id}`}
                type="button"
                onClick={() => {
                  if (alert.unread) {
                    readReactionAlertsMutation.mutate();
                  }
                  const target =
                    alert.channel === "GROUP" && alert.groupSlug
                      ? `/groups?group=${encodeURIComponent(alert.groupSlug)}&postId=${alert.postId}`
                      : alert.channel === "SERVICES"
                        ? `/services?postId=${alert.postId}`
                        : `/community?postId=${alert.postId}`;
                  navigate(target);
                }}
                className={`block w-full rounded-lg border p-3 text-left transition hover:bg-slate-50 ${
                  alert.unread ? "border-pink-200 bg-pink-50/50" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">Reaction</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      alert.unread ? "bg-pink-100 text-pink-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {alert.unread ? "NEW" : "READ"}
                  </span>
                </div>
                <p className="feed-author-name mt-1 text-slate-900">
                  {alert.actorName} {alert.reactionType === "HEART" ? "liked" : "gave a thumbs up to"} your post
                </p>
                <p className="feed-post-copy mt-1 line-clamp-2 text-slate-700">{alert.postPreview}</p>
                <p className="feed-meta mt-2 text-slate-500">{new Date(alert.createdAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No post reaction alerts yet.</p>
        )}
      </section>

      <section className="card p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="app-section-title text-slate-900">Violations feed</h3>
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-600 px-2 py-1 text-xs font-semibold text-white">
                {unreadViolationCount} new
              </span>
              <button
                type="button"
                onClick={markViolationAlertsRead}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Mark as read
              </button>
            </div>
          ) : null}
        </div>
        {!isAdmin ? (
          <p className="text-sm text-slate-500">Violation alerts are visible only to community admins.</p>
        ) : violationsQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading violations...</p>
        ) : violationsQuery.isError ? (
          <p className="text-sm text-rose-700">{(violationsQuery.error as Error).message}</p>
        ) : violationAlerts.length ? (
          <div className="space-y-2">
            {violationAlerts.map((item) => (
              <button
                key={`violation-alert-${item.id}`}
                type="button"
                onClick={() => {
                  if (item.unread) {
                    markViolationsSeen(item.createdAt);
                  }
                  navigate("/violations");
                }}
                className={`block w-full rounded-lg border p-3 text-left transition hover:bg-slate-50 ${
                  item.unread ? "border-rose-200 bg-rose-50/40" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Violation report</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.unread ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.unread ? "NEW" : "READ"}
                  </span>
                </div>
                <p className="feed-author-name mt-1 text-slate-900">{item.reporterName} sent a new violation report</p>
                <p className="feed-post-copy mt-1 line-clamp-2 text-slate-700">{item.description}</p>
                <p className="feed-meta mt-2 text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No new violation reports.</p>
        )}
      </section>

      <section className="card p-4">
        <h3 className="app-section-title mb-2 text-slate-900">Board messages</h3>
        {broadcastsQuery.isLoading ? <p className="text-sm text-slate-500">Loading board messages...</p> : null}
        {broadcastsQuery.isError ? (
          <p className="text-sm text-rose-700">{(broadcastsQuery.error as Error).message}</p>
        ) : null}
        {broadcastsQuery.data?.length ? (
          <div className="space-y-2">
            {broadcastsQuery.data.map((broadcast) => (
              <article key={broadcast.id} className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="feed-author-name text-slate-900">{broadcast.title}</p>
                <p className="feed-post-copy mt-1 text-slate-700">{broadcast.body}</p>
                <p className="feed-meta mt-1 text-slate-500">
                  {broadcast.authorName} - {new Date(broadcast.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No board messages yet.</p>
        )}
      </section>

      <section className="card p-4">
        <h3 className="app-section-title mb-2 text-slate-900">Active polls</h3>
        {pollsQuery.isLoading ? <p className="text-sm text-slate-500">Loading polls...</p> : null}
        {pollsQuery.isError ? <p className="text-sm text-rose-700">{(pollsQuery.error as Error).message}</p> : null}
        {pollsQuery.data?.length ? (
          <div className="space-y-2">
            {pollsQuery.data.map((poll) => {
              const totalVotes = poll.voteCounts.reduce((sum, current) => sum + current, 0);
              return (
                <article key={poll.id} className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                  <p className="feed-author-name text-slate-900">{poll.question}</p>
                  <p className="feed-meta mt-1 text-slate-500">{totalVotes} vote(s)</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {poll.options.map((option, index) => {
                      const voted = poll.viewerVoteIndex === index;
                      return (
                        <button
                          key={`${poll.id}-${index}`}
                          type="button"
                          disabled={!canVote || voteMutation.isPending}
                          onClick={() => voteMutation.mutate({ pollId: poll.id, optionIndex: index })}
                          className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                            voted
                              ? "border-violet-400 bg-violet-200 text-violet-900"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          } disabled:opacity-60`}
                        >
                          <span className="font-medium">{option}</span>
                            <span className="feed-meta ml-1 text-slate-500">({poll.voteCounts[index] ?? 0})</span>
                        </button>
                      );
                    })}
                  </div>
                  {!canVote ? (
                    <p className="mt-2 text-xs font-medium text-amber-700">Tenants can view HOA polls but cannot vote.</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No active polls.</p>
        )}
      </section>

      <section className="card p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="app-section-title text-slate-900">Group requests</h3>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500 px-2 py-1 text-xs font-semibold text-white">
              {unreadGroupRequestCount} new
            </span>
            <button
              type="button"
              onClick={markGroupRequestAlertsRead}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Mark as read
            </button>
          </div>
        </div>
        {groupRequestsQuery.isLoading ? <p className="text-sm text-slate-500">Loading group requests...</p> : null}
        {groupRequestsQuery.isError ? (
          <p className="text-sm text-rose-700">{(groupRequestsQuery.error as Error).message}</p>
        ) : null}
        {groupRequestAlerts.length ? (
          <div className="space-y-2">
            {groupRequestAlerts.map((request) => (
              <article key={request.requestId} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="feed-author-name text-slate-900">New request for {request.groupName}</p>
                    <p className="feed-post-copy mt-1 text-slate-700">
                      {request.requesterName} wants to join your private group.
                    </p>
                    <p className="feed-meta mt-1 text-slate-500">
                      {request.requesterEmail} - {new Date(request.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                      request.unread ? "bg-white text-amber-700" : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {request.unread ? "NEW" : "READ"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (request.unread) {
                        markGroupRequestsSeen(request.createdAt);
                        setRefreshVersion((current) => current + 1);
                      }
                      navigate("/groups?allGroups=1");
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Open group
                  </button>
                  <button
                    type="button"
                    disabled={approveRequestMutation.isPending}
                    onClick={() => approveRequestMutation.mutate(request.requestId)}
                    className="rounded-lg bg-leaf-600 px-3 py-2 text-xs font-semibold text-white hover:bg-leaf-700 disabled:opacity-70"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={rejectRequestMutation.isPending}
                    onClick={() => rejectRequestMutation.mutate(request.requestId)}
                    className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-70"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No pending group requests.</p>
        )}
      </section>

      <section className="card p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="app-section-title text-slate-900">Groups activity</h3>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-600 px-2 py-1 text-xs font-semibold text-white">{unreadCount} new</span>
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {groupFeedQuery.isLoading ? <p className="text-sm text-slate-500">Loading group activity...</p> : null}
        {groupFeedQuery.isError ? (
          <p className="text-sm text-rose-700">{(groupFeedQuery.error as Error).message}</p>
        ) : null}

        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500">No group activity for your followed groups.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
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
                className={`block w-full rounded-lg border p-3 text-left transition hover:bg-slate-50 ${
                  alert.unread ? "border-rose-200 bg-rose-50/40" : "border-slate-200"
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
                <p className="feed-author-name mt-1 text-slate-900">{alert.authorName} posted a new message</p>
                <p className="feed-post-copy mt-1 line-clamp-2 text-slate-700">{alert.text || "Media post"}</p>
                <p className="feed-meta mt-2 text-slate-500">{new Date(alert.createdAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
        )}

        {groupFeedQuery.hasNextPage ? (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => groupFeedQuery.fetchNextPage()}
              disabled={groupFeedQuery.isFetchingNextPage}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-70"
            >
              {groupFeedQuery.isFetchingNextPage ? "Loading..." : "Load more activity"}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
