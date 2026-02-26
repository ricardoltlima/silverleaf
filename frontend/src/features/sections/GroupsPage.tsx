import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FeedPage } from "@/features/feed/FeedPage";
import {
  createGroup,
  fetchGroups,
  subscribeGroup,
  unsubscribeGroup,
  type GroupItem
} from "@/features/groups/groupsApi";

export function GroupsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const groupsQuery = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups
  });
  const createGroupMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    }
  });
  const subscribeMutation = useMutation({
    mutationFn: subscribeGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] })
  });
  const unsubscribeMutation = useMutation({
    mutationFn: unsubscribeGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] })
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formVisibility, setFormVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  const subscribedGroups = useMemo(
    () => (groupsQuery.data ?? []).filter((group) => group.subscribed),
    [groupsQuery.data]
  );

  const requestedGroupSlug = searchParams.get("group");
  const initialExpanded =
    requestedGroupSlug && subscribedGroups.some((group) => group.slug === requestedGroupSlug)
      ? requestedGroupSlug
      : null;
  const [expandedGroupSlug, setExpandedGroupSlug] = useState<string | null>(initialExpanded);

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
              Subscribed groups are listed below. Use Menu to subscribe/unsubscribe.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700"
          >
            Menu
          </button>
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

      {menuOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-[min(760px,96vw)] rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Group Menu</h3>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={onCreateGroup} className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-900">Create a group</p>
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

            <div className="max-h-[42vh] space-y-2 overflow-y-auto">
              {(groupsQuery.data ?? []).map((group: GroupItem) => (
                <div key={group.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                      <p className="text-xs text-slate-600">
                        {group.visibility} - {group.memberCount} members
                      </p>
                    </div>
                    {group.subscribed ? (
                      <button
                        type="button"
                        onClick={() => unsubscribeMutation.mutate(group.id)}
                        className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Unsubscribe
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => subscribeMutation.mutate(group.id)}
                        className="rounded-lg border border-leaf-300 bg-leaf-50 px-3 py-2 text-xs font-semibold text-leaf-700 hover:bg-leaf-100"
                      >
                        Subscribe
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
