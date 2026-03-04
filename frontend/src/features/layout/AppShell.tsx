import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearTokens, getActiveCommunity, getRefreshToken, setTokens } from "@/lib/authStorage";
import { switchCommunity } from "@/features/auth/authApi";
import { fetchReactionAlerts } from "@/features/alerts/alertsApi";
import { RightRail } from "@/features/layout/RightRail";
import { ProfilePhotoEditorModal } from "@/features/layout/ProfilePhotoEditorModal";
import { CommunityStandardsModal } from "@/features/hoa/CommunityStandardsModal";
import { ClubhouseFormModal } from "@/features/hoa/ClubhouseFormModal";
import { MessagesModal } from "@/features/messages/MessagesModal";
import { fetchUnreadCount } from "@/features/messages/messagesApi";
import { fetchFeed, fetchReportedPosts } from "@/features/feed/feedApi";
import { getUnreadGroupPosts } from "@/features/groups/groupAlerts";
import { fetchGroupRequests } from "@/features/groups/groupsApi";
import { getLastSeenGroupRequestsAt } from "@/features/groups/groupRequestsStorage";
import { fetchAllViolations } from "@/features/board/boardApi";
import { getLastSeenReportsAt } from "@/features/board/reportsStorage";
import { getLastSeenViolationsAt } from "@/features/board/violationsStorage";
import {
  fetchCurrentUser,
  fetchMyCommunities,
  fetchMyHousehold,
  uploadMyProfilePhoto,
  type CurrentUser
} from "@/features/users/currentUserApi";
import { canManageCommunity, isSystemAdmin } from "@/features/users/roleUtils";

const links = [
  { to: "/community", label: "Home", icon: "/icon-home.svg", type: "route" as const },
  { to: "/messages", label: "Messages", icon: "/icon-messages.svg", type: "messages" as const },
  { to: "/alerts", label: "Alerts", icon: "/icon-notifications.svg", type: "route" as const },
  { to: "/profile", label: "Profile", icon: "/icon-profile.svg", type: "route" as const }
];

const menuLinks = [
  { to: "/community", label: "Community" },
  { to: "/neighbors", label: "Neighbors" },
  { to: "/services", label: "Services" },
  { to: "/garage-sales", label: "Garage Sales" },
  { to: "/groups", label: "Groups" }
];

const boardAdminLinks = [
  { to: "/hoa/workspace", label: "Workspace" },
  { to: "/board/news", label: "Board News" },
  { to: "/board/broadcasts", label: "Message Everyone" },
  { to: "/board/polls", label: "Polls" },
  { to: "/board/reports", label: "Reports" }
];

const communityAdminRoutes = new Set([
  "/hoa/workspace",
  "/board/news",
  "/board/broadcasts",
  "/board/polls",
  "/board/reports",
  "/violations"
]);

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, content] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, { type: mimeType });
}

export function AppShell() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [messagesTargetUserId, setMessagesTargetUserId] = useState<number | null>(null);
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser
  });
  const householdQuery = useQuery({
    queryKey: ["my-household"],
    queryFn: fetchMyHousehold,
    retry: false
  });
  const communitiesQuery = useQuery({
    queryKey: ["me", "communities"],
    queryFn: fetchMyCommunities
  });
  const [hoaExpanded, setHoaExpanded] = useState(false);
  const [openDoc, setOpenDoc] = useState<null | "community-standards" | "clubhouse-form">(null);
  const [photoDraft, setPhotoDraft] = useState<string | null>(null);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const unreadCountQuery = useQuery({
    queryKey: ["messages", "unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 5000
  });
  const groupAlertsQuery = useQuery({
    queryKey: ["feed", "group", "alerts", "badge"],
    queryFn: () => fetchFeed(100, "GROUP"),
    refetchInterval: 5000
  });
  const groupRequestsQuery = useQuery({
    queryKey: ["groups", "requests", "badge"],
    queryFn: fetchGroupRequests,
    refetchInterval: 5000
  });
  const reactionAlertsQuery = useQuery({
    queryKey: ["alerts", "reactions", "badge"],
    queryFn: fetchReactionAlerts,
    refetchInterval: 5000
  });
  const isAdmin = canManageCommunity(meQuery.data);
  const isSystem = isSystemAdmin(meQuery.data?.role);
  const violationsQuery = useQuery({
    queryKey: ["violations", "alerts", "badge"],
    queryFn: fetchAllViolations,
    enabled: isAdmin,
    refetchInterval: 5000
  });
  const reportsQuery = useQuery({
    queryKey: ["feed", "reports", "badge"],
    queryFn: fetchReportedPosts,
    enabled: isAdmin,
    refetchInterval: 5000
  });
  const [groupSeenVersion, setGroupSeenVersion] = useState(0);
  const [groupRequestsSeenVersion, setGroupRequestsSeenVersion] = useState(0);
  const [violationsSeenVersion, setViolationsSeenVersion] = useState(0);
  const [reportsSeenVersion, setReportsSeenVersion] = useState(0);

  useEffect(() => {
    const onSeenChange = () => setGroupSeenVersion((current) => current + 1);
    window.addEventListener("silverleaf-group-seen-changed", onSeenChange);
    return () => {
      window.removeEventListener("silverleaf-group-seen-changed", onSeenChange);
    };
  }, []);

  useEffect(() => {
    const onSeenChange = () => setViolationsSeenVersion((current) => current + 1);
    window.addEventListener("silverleaf-violations-seen-changed", onSeenChange);
    return () => {
      window.removeEventListener("silverleaf-violations-seen-changed", onSeenChange);
    };
  }, []);

  useEffect(() => {
    const onSeenChange = () => setGroupRequestsSeenVersion((current) => current + 1);
    window.addEventListener("silverleaf-group-requests-seen-changed", onSeenChange);
    return () => {
      window.removeEventListener("silverleaf-group-requests-seen-changed", onSeenChange);
    };
  }, []);

  useEffect(() => {
    const onSeenChange = () => setReportsSeenVersion((current) => current + 1);
    window.addEventListener("silverleaf-reports-seen-changed", onSeenChange);
    return () => {
      window.removeEventListener("silverleaf-reports-seen-changed", onSeenChange);
    };
  }, []);

  useEffect(() => {
    const onOpenMessages = (event: Event) => {
      const customEvent = event as CustomEvent<number | null>;
      setMessagesTargetUserId(customEvent.detail ?? null);
      setMessagesOpen(true);
    };
    window.addEventListener("silverleaf-open-messages", onOpenMessages as EventListener);
    return () => {
      window.removeEventListener("silverleaf-open-messages", onOpenMessages as EventListener);
    };
  }, []);

  const unreadGroupAlertsCount = useMemo(
    () => getUnreadGroupPosts(groupAlertsQuery.data?.items ?? []).length,
    [groupAlertsQuery.data?.items, groupSeenVersion]
  );
  const unreadGroupRequestsCount = useMemo(() => {
    const lastSeenAt = getLastSeenGroupRequestsAt();
    return (groupRequestsQuery.data ?? []).filter((request) => {
      if (!lastSeenAt) {
        return true;
      }
      return new Date(request.createdAt).getTime() > new Date(lastSeenAt).getTime();
    }).length;
  }, [groupRequestsQuery.data, groupRequestsSeenVersion]);
  const unreadViolationAlertsCount = useMemo(() => {
    if (!isAdmin) {
      return 0;
    }
    const lastSeenAt = getLastSeenViolationsAt();
    return (violationsQuery.data ?? []).filter((item) => {
      if (item.status !== "OPEN") {
        return false;
      }
      if (!lastSeenAt) {
        return true;
      }
      return new Date(item.createdAt).getTime() > new Date(lastSeenAt).getTime();
    }).length;
  }, [isAdmin, violationsQuery.data, violationsSeenVersion]);
  const unreadReactionAlertsCount = useMemo(
    () => (reactionAlertsQuery.data ?? []).filter((item) => item.unread).length,
    [reactionAlertsQuery.data]
  );
  const unreadReportsCount = useMemo(() => {
    if (!isAdmin) {
      return 0;
    }
    const lastSeenAt = getLastSeenReportsAt();
    return (reportsQuery.data ?? []).filter((item) => {
      if (!lastSeenAt) {
        return true;
      }
      return new Date(item.latestReportedAt).getTime() > new Date(lastSeenAt).getTime();
    }).length;
  }, [isAdmin, reportsQuery.data, reportsSeenVersion]);
  const unreadAlertsCount =
    unreadGroupAlertsCount + unreadGroupRequestsCount + unreadViolationAlertsCount + unreadReactionAlertsCount;

  useEffect(() => {
    if (meQuery.data?.photoUrl !== undefined) {
      setProfilePhoto(meQuery.data.photoUrl);
      window.dispatchEvent(new CustomEvent("silverleaf-profile-photo-changed", { detail: meQuery.data.photoUrl || null }));
    }
  }, [meQuery.data?.photoUrl]);

  const uploadPhotoMutation = useMutation({
    mutationFn: uploadMyProfilePhoto,
    onSuccess: (updatedMe) => {
      queryClient.setQueryData<CurrentUser>(["me"], updatedMe);
      setProfilePhoto(updatedMe.photoUrl);
      window.dispatchEvent(
        new CustomEvent("silverleaf-profile-photo-changed", {
          detail: updatedMe.photoUrl || null
        })
      );
    }
  });

  const switchCommunityMutation = useMutation({
    mutationFn: async (communityId: number) => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("Refresh token missing");
      }
      return switchCommunity(communityId, refreshToken);
    },
    onSuccess: async (result) => {
      setTokens(result.accessToken, result.refreshToken, {
        id: result.activeCommunityId,
        slug: result.activeCommunitySlug,
        name: result.activeCommunityName
      });

      const [nextMe, nextCommunities, nextHousehold] = await Promise.all([
        fetchCurrentUser(),
        fetchMyCommunities(),
        fetchMyHousehold()
      ]);

      queryClient.removeQueries({
        predicate: (query) => {
          const [root, second] = query.queryKey;
          return !(
            root === "me" ||
            (root === "my-household" && second === undefined)
          );
        }
      });

      queryClient.setQueryData<CurrentUser>(["me"], nextMe);
      queryClient.setQueryData(["me", "communities"], nextCommunities);
      queryClient.setQueryData(["my-household"], nextHousehold);
      setProfilePhoto(nextMe.photoUrl);
      window.dispatchEvent(
        new CustomEvent("silverleaf-profile-photo-changed", {
          detail: nextMe.photoUrl || null
        })
      );

      await queryClient.invalidateQueries({
        predicate: (query) => {
          const [root, second] = query.queryKey;
          return !(
            root === "me" ||
            (root === "my-household" && second === undefined)
          );
        }
      });

      if (communityAdminRoutes.has(location.pathname) && !canManageCommunity(nextMe)) {
        navigate("/community", { replace: true });
      }
    }
  });

  const logout = () => {
    clearTokens();
    window.location.replace("/");
  };

  const onPhotoChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDraft(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const saveProfilePhoto = (value: string) => {
    setProfilePhoto(value);
    setPhotoDraft(null);
    window.dispatchEvent(new CustomEvent("silverleaf-profile-photo-changed", { detail: value }));
    const file = dataUrlToFile(value, "profile.jpg");
    uploadPhotoMutation.mutate(file);
  };

  const closeDocModal = () => setOpenDoc(null);
  const activeMembership = communitiesQuery.data?.find((membership) => membership.active);
  const activeCommunityName = activeMembership?.communityName ?? meQuery.data?.activeCommunityName ?? null;
  const activeScopeLabel = isSystem
    ? "System Admin"
    : isAdmin
      ? "Community Admin"
      : "Resident Access";

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl justify-center px-4 py-3">
          <div className="flex items-center gap-6">
            <img src="/silverleaf-icon.svg" alt="Silverleaf" className="h-10 w-10 rounded-xl shadow-sm" />
            <nav className="flex items-center gap-1">
            {links.map((link) => (
              link.type === "messages" ? (
                <button
                  key={link.to}
                  type="button"
                  onClick={() => {
                    setMessagesTargetUserId(null);
                    setMessagesOpen(true);
                  }}
                  className="relative flex min-w-20 flex-col items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  <img src={link.icon} alt="" className="mb-1 h-5 w-5" />
                  <span>{link.label}</span>
                  {(unreadCountQuery.data?.unreadCount ?? 0) > 0 ? (
                    <span className="absolute right-2 top-1 inline-flex min-w-6 items-center justify-center rounded-[999px] border border-rose-200/60 bg-rose-100/75 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-700 shadow-[0_6px_16px_rgba(244,63,94,0.12)] backdrop-blur-sm">
                      {unreadCountQuery.data?.unreadCount}
                    </span>
                  ) : null}
                </button>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `relative flex min-w-20 flex-col items-center rounded-lg px-3 py-2 text-xs font-medium transition ${
                      isActive ? "bg-leaf-50 text-leaf-900" : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  <img src={link.icon} alt="" className="mb-1 h-5 w-5" />
                  <span>{link.label}</span>
                  {link.to === "/alerts" && unreadAlertsCount > 0 ? (
                    <span className="absolute right-2 top-1 inline-flex min-w-6 items-center justify-center rounded-[999px] border border-rose-200/60 bg-rose-100/75 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-700 shadow-[0_6px_16px_rgba(244,63,94,0.12)] backdrop-blur-sm">
                      {unreadAlertsCount}
                    </span>
                  ) : null}
                </NavLink>
              )
            ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[250px_1fr] xl:grid-cols-[250px_1fr_300px]">
        <aside className="space-y-4">
          <section className="card overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-leaf-600 to-emerald-400" />
            <div className="p-4 text-center">
              <label className="-mt-10 mb-2 inline-block cursor-pointer">
                <img
                  src={
                    profilePhoto ||
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' fill='%23d6e6f8'/%3E%3Ccircle cx='36' cy='27' r='14' fill='%23a5bfdc'/%3E%3Cellipse cx='36' cy='60' rx='22' ry='14' fill='%23a5bfdc'/%3E%3C/svg%3E"
                  }
                  alt="Profile"
                  className="mx-auto h-20 w-20 rounded-full border-4 border-white object-cover shadow"
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    onPhotoChange(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                />
              </label>
              <h3 className="text-base font-semibold text-slate-900">
                {meQuery.data?.fullName || "Silverleaf Resident"}
              </h3>
              <p className="text-xs text-slate-500">
                {householdQuery.data?.houseAddress || "Address not set"}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {activeCommunityName ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                    {activeCommunityName}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    isSystem
                      ? "bg-slate-900 text-white"
                      : isAdmin
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {activeScopeLabel}
                </span>
              </div>
              {communitiesQuery.data && communitiesQuery.data.length > 1 ? (
                <div className="mt-3 text-left">
                  <label htmlFor="community-switcher" className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Active community
                  </label>
                  <select
                    id="community-switcher"
                    value={getActiveCommunity()?.id ?? meQuery.data?.activeCommunityId ?? ""}
                    onChange={(event) => switchCommunityMutation.mutate(Number(event.target.value))}
                    disabled={switchCommunityMutation.isPending}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-leaf-600 focus:ring-2"
                  >
                    {communitiesQuery.data.map((membership) => (
                      <option key={membership.communityId} value={membership.communityId}>
                        {membership.communityName}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Switching communities also switches your access scope for HOA tools in this session.
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="card p-2">
            <button
              type="button"
              onClick={() => setHoaExpanded((current) => !current)}
              className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <span>HOA</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all ${
                  hoaExpanded ? "rotate-180 border-leaf-200 text-leaf-700" : ""
                }`}
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
                  <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            <div
              className={`overflow-hidden pl-3 transition-all duration-300 ${
                hoaExpanded ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenDoc("community-standards")}
                className="mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
              >
                Community Standards
              </button>
              <button
                type="button"
                onClick={() => setOpenDoc("clubhouse-form")}
                className="mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
              >
                Clubhouse Form
              </button>
              <NavLink
                to="/report-violation"
                className={({ isActive }) =>
                  `mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive ? "bg-leaf-50 text-leaf-900" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                Report violation
              </NavLink>
              {isAdmin ? (
                <NavLink
                  to="/violations"
                  className={({ isActive }) =>
                    `mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      isActive ? "bg-leaf-50 text-leaf-900" : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  Violations
                </NavLink>
              ) : null}
            </div>

            {menuLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    isActive ? "bg-leaf-50 text-leaf-900" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isAdmin ? (
              <div className="mt-2 border-t border-slate-200 pt-2">
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  HOA Board
                </p>
                {boardAdminLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `relative mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                        isActive ? "bg-indigo-50 text-indigo-900" : "text-slate-700 hover:bg-slate-100"
                      }`
                    }
                  >
                    {item.label}
                    {item.to === "/board/reports" && unreadReportsCount > 0 ? (
                      <span className="absolute right-3 top-1/2 inline-flex min-w-6 -translate-y-1/2 items-center justify-center rounded-[999px] border border-rose-200/60 bg-rose-100/75 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-700 shadow-[0_6px_16px_rgba(244,63,94,0.12)] backdrop-blur-sm">
                        {unreadReportsCount}
                      </span>
                    ) : null}
                  </NavLink>
                ))}
              </div>
            ) : null}
            {isSystem ? (
              <div className="mt-2 border-t border-slate-200 pt-2">
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  System Admin
                </p>
                <NavLink
                  to="/system-admin"
                  className={({ isActive }) =>
                    `mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                      isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                    }`
                  }
                >
                  Control Center
                </NavLink>
              </div>
            ) : null}
          </section>

          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Logout
          </button>
        </aside>

        <main>
          <Outlet />
        </main>

        <RightRail />
      </div>

      {openDoc === "community-standards" ? <CommunityStandardsModal onClose={closeDocModal} /> : null}
      {openDoc === "clubhouse-form" ? <ClubhouseFormModal onClose={closeDocModal} /> : null}
      {photoDraft ? (
        <ProfilePhotoEditorModal
          source={photoDraft}
          onCancel={() => setPhotoDraft(null)}
          onSave={saveProfilePhoto}
        />
      ) : null}
      <MessagesModal
        open={messagesOpen}
        initialSelectedUserId={messagesTargetUserId}
        onClose={() => {
          setMessagesOpen(false);
          setMessagesTargetUserId(null);
        }}
      />
    </div>
  );
}
