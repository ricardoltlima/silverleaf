import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearTokens } from "@/lib/authStorage";
import { RightRail } from "@/features/layout/RightRail";
import { ProfilePhotoEditorModal } from "@/features/layout/ProfilePhotoEditorModal";
import { CommunityStandardsModal } from "@/features/hoa/CommunityStandardsModal";
import { ClubhouseFormModal } from "@/features/hoa/ClubhouseFormModal";
import { MessagesModal } from "@/features/messages/MessagesModal";
import { fetchUnreadCount } from "@/features/messages/messagesApi";
import { fetchFeed } from "@/features/feed/feedApi";
import { getUnreadGroupPosts } from "@/features/groups/groupAlerts";
import { fetchGroupRequests } from "@/features/groups/groupsApi";
import { fetchAllViolations } from "@/features/board/boardApi";
import { getLastSeenViolationsAt } from "@/features/board/violationsStorage";
import {
  fetchCurrentUser,
  fetchMyHousehold,
  uploadMyProfilePhoto,
  type CurrentUser
} from "@/features/users/currentUserApi";
import { isHoaManager, isSystemAdmin } from "@/features/users/roleUtils";

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
  { to: "/board/news", label: "Board News" },
  { to: "/board/broadcasts", label: "Message Everyone" },
  { to: "/board/polls", label: "Polls" }
];

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
  const isAdmin = isHoaManager(meQuery.data?.role);
  const isSystem = isSystemAdmin(meQuery.data?.role);
  const violationsQuery = useQuery({
    queryKey: ["violations", "alerts", "badge"],
    queryFn: fetchAllViolations,
    enabled: isAdmin,
    refetchInterval: 5000
  });
  const [groupSeenVersion, setGroupSeenVersion] = useState(0);
  const [violationsSeenVersion, setViolationsSeenVersion] = useState(0);

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
  const unreadAlertsCount =
    unreadGroupAlertsCount + (groupRequestsQuery.data?.length ?? 0) + unreadViolationAlertsCount;

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
                    <span className="absolute right-2 top-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
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
                    <span className="absolute right-2 top-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
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
            </div>
          </section>

          <section className="card p-2">
            <button
              type="button"
              onClick={() => setHoaExpanded((current) => !current)}
              className={`mb-2 flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                hoaExpanded
                  ? "border-leaf-200 bg-[linear-gradient(135deg,_#f7fbf4_0%,_#eef6f0_55%,_#f8fafc_100%)] shadow-sm"
                  : "border-slate-200 bg-white hover:border-leaf-200 hover:bg-[linear-gradient(135deg,_#fbfdf9_0%,_#f4f8f5_100%)]"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,_#3f7f52_0%,_#6aa26b_100%)] text-white shadow-sm ring-1 ring-leaf-200/60">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
                    <path d="M3 10.5 12 4l9 6.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.5 9.5V20h13V9.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 20v-5.5h6V20" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-leaf-700">
                    Silverleaf
                  </span>
                  <span className="text-sm font-semibold text-slate-900">HOA</span>
                </span>
              </span>
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
              className={`overflow-hidden rounded-2xl bg-slate-50/85 pl-3 transition-all duration-300 ${
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
              {isAdmin ? (
                <NavLink
                  to="/hoa/workspace"
                  className={({ isActive }) =>
                    `mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      isActive ? "bg-leaf-50 text-leaf-900" : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  HOA Workspace
                </NavLink>
              ) : null}
              <NavLink
                to="/reservations"
                className={({ isActive }) =>
                  `mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive ? "bg-leaf-50 text-leaf-900" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                Reservations Calendar
              </NavLink>
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
                      `mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                        isActive ? "bg-indigo-50 text-indigo-900" : "text-slate-700 hover:bg-slate-100"
                      }`
                    }
                  >
                    {item.label}
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
