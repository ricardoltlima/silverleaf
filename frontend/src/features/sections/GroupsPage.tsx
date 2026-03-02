import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FeedPage } from "@/features/feed/FeedPage";
import {
  approveGroupRequest,
  createGroup,
  fetchGroupRequests,
  fetchGroups,
  rejectGroupRequest,
  subscribeGroup,
  unsubscribeGroup,
  type GroupItem,
  type GroupJoinRequest
} from "@/features/groups/groupsApi";

function GroupRequestCard({
  request,
  onApprove,
  onReject,
  busy
}: {
  request: GroupJoinRequest;
  onApprove: (requestId: number) => void;
  onReject: (requestId: number) => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-lg border border-indigo-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{request.requesterName}</p>
          <p className="text-xs text-slate-600">{request.requesterEmail}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onApprove(request.requestId)}
            className="rounded-lg bg-leaf-600 px-3 py-2 text-xs font-semibold text-white hover:bg-leaf-700 disabled:opacity-70"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onReject(request.requestId)}
            className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-70"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export function GroupsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const shouldOpenAllGroups = searchParams.get("allGroups") === "1";
  const groupsQuery = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups
  });
  const requestsQuery = useQuery({
    queryKey: ["groups", "requests"],
    queryFn: fetchGroupRequests
  });

  const invalidateGroups = () => {
    queryClient.invalidateQueries({ queryKey: ["groups"] });
    queryClient.invalidateQueries({ queryKey: ["groups", "requests"] });
  };

  const createGroupMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => invalidateGroups()
  });
  const subscribeMutation = useMutation({
    mutationFn: subscribeGroup,
    onSuccess: () => invalidateGroups()
  });
  const unsubscribeMutation = useMutation({
    mutationFn: unsubscribeGroup,
    onSuccess: () => invalidateGroups()
  });
  const approveRequestMutation = useMutation({
    mutationFn: approveGroupRequest,
    onSuccess: () => invalidateGroups()
  });
  const rejectRequestMutation = useMutation({
    mutationFn: rejectGroupRequest,
    onSuccess: () => invalidateGroups()
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [allGroupsOpen, setAllGroupsOpen] = useState(shouldOpenAllGroups);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formVisibility, setFormVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  const subscribedGroups = useMemo(
    () => (groupsQuery.data ?? []).filter((group) => group.subscribed),
    [groupsQuery.data]
  );
  const ownedGroups = useMemo(
    () => (groupsQuery.data ?? []).filter((group) => group.owner),
    [groupsQuery.data]
  );
  const ownedGroupIds = useMemo(() => new Set(ownedGroups.map((group) => group.id)), [ownedGroups]);
  const ownedRequests = useMemo(
    () => (requestsQuery.data ?? []).filter((request) => ownedGroupIds.has(request.groupId)),
    [requestsQuery.data, ownedGroupIds]
  );
  const requestsByGroupId = useMemo(() => {
    const grouped = new Map<number, GroupJoinRequest[]>();
    ownedRequests.forEach((request) => {
      const current = grouped.get(request.groupId) ?? [];
      current.push(request);
      grouped.set(request.groupId, current);
    });
    return grouped;
  }, [ownedRequests]);

  const requestedGroupSlug = searchParams.get("group");
  const initialExpanded =
    requestedGroupSlug && subscribedGroups.some((group) => group.slug === requestedGroupSlug)
      ? requestedGroupSlug
      : null;
  const [expandedGroupSlug, setExpandedGroupSlug] = useState<string | null>(initialExpanded);

  useEffect(() => {
    setAllGroupsOpen(shouldOpenAllGroups);
  }, [shouldOpenAllGroups]);

  const onCreateGroup = (event: FormEvent) => {
    event.preventDefault();
    const name = formName.trim();
    if (!name) return;
    createGroupMutation.mutate(
      {
        name,
        description: formDescription.trim(),
        visibility: formVisibility
      },
      {
        onSuccess: (created) => {
          setFormName("");
          setFormDescription("");
          setFormVisibility("PUBLIC");
          setExpandedGroupSlug(created.slug);
          setCreateOpen(false);
        }
      }
    );
  };

  if (groupsQuery.isLoading) {
    return <section className="card p-6 text-sm text-slate-600">Loading groups...</section>;
  }

  if (groupsQuery.isError) {
    return <section className="card p-6 text-sm text-red-600">{(groupsQuery.error as Error).message}</section>;
  }

  return (
    <div className="space-y-3">
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
          Groups
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">My Groups</h2>
            <p className="mt-1 text-sm text-slate-600">
              Subscribed groups are listed below. Use Create to open a new group and All groups to browse, request, or manage access.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setAllGroupsOpen(true)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              All groups
            </button>
          </div>
        </div>
      </section>

      {subscribedGroups.length === 0 ? (
        <section className="card p-6 text-sm text-slate-600">
          You are not subscribed to any groups yet.
        </section>
      ) : (
        subscribedGroups.map((group) => {
          const expanded = expandedGroupSlug === group.slug;
          return (
            <section key={group.slug} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedGroupSlug((current) => (current === group.slug ? null : group.slug))}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                  <p className="text-xs text-slate-600">
                    {group.description || "No description"} - {group.memberCount} members - {group.visibility}
                  </p>
                </div>
                <span className={`text-xs text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}>v</span>
              </button>

              {expanded ? (
                <div className="border-t border-slate-200 p-4">
                  <FeedPage
                    channel="GROUP"
                    groupSlug={group.slug}
                    composerPlaceholder={`Share something with ${group.name}...`}
                  />
                </div>
              ) : null}
            </section>
          );
        })
      )}

      {createOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="w-[min(760px,96vw)] rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Create group</h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={onCreateGroup} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="Group name"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
                />
                <select
                  value={formVisibility}
                  onChange={(event) => setFormVisibility(event.target.value as "PUBLIC" | "PRIVATE")}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
                <textarea
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                  rows={2}
                  placeholder="Description"
                  className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
                />
              </div>
              <button
                type="submit"
                disabled={createGroupMutation.isPending}
                className="mt-2 rounded-lg bg-leaf-600 px-3 py-2 text-xs font-semibold text-white hover:bg-leaf-700 disabled:opacity-70"
              >
                Create group
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {allGroupsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setAllGroupsOpen(false)}
        >
          <div
            className="w-[min(920px,96vw)] rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">All groups</h3>
              <button
                type="button"
                onClick={() => setAllGroupsOpen(false)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {(groupsQuery.data ?? []).map((group: GroupItem) => {
                const groupRequests = requestsByGroupId.get(group.id) ?? [];
                return (
                  <div key={group.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                        <p className="text-xs text-slate-600">
                          {group.visibility} - {group.memberCount} members - owner {group.ownerName}
                        </p>
                        {group.description ? <p className="mt-1 text-xs text-slate-500">{group.description}</p> : null}
                      </div>
                      {group.subscribed ? (
                        group.owner ? (
                          <span className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                            Owner
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => unsubscribeMutation.mutate(group.id)}
                            className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            Unsubscribe
                          </button>
                        )
                      ) : group.requestPending ? (
                        <span className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                          Pending request
                        </span>
                      ) : group.requestStatus === "REJECTED" ? (
                        <button
                          type="button"
                          disabled
                          className="cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500"
                          title="Your request was denied by the group owner"
                        >
                          Denied
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => subscribeMutation.mutate(group.id)}
                          className="rounded-lg border border-leaf-300 bg-leaf-50 px-3 py-2 text-xs font-semibold text-leaf-700 hover:bg-leaf-100"
                        >
                          {group.visibility === "PRIVATE" ? "Request access" : "Subscribe"}
                        </button>
                      )}
                    </div>

                    {group.owner && groupRequests.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-indigo-900">Pending requests</h4>
                          <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-indigo-700">
                            {groupRequests.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {groupRequests.map((request) => (
                            <GroupRequestCard
                              key={request.requestId}
                              request={request}
                              busy={approveRequestMutation.isPending || rejectRequestMutation.isPending}
                              onApprove={(requestId) => approveRequestMutation.mutate(requestId)}
                              onReject={(requestId) => rejectRequestMutation.mutate(requestId)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
