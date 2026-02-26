import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearTokens } from "@/lib/authStorage";
import { RightRail } from "@/features/layout/RightRail";
import { PdfDocumentModal } from "@/features/layout/PdfDocumentModal";
import { ProfilePhotoEditorModal } from "@/features/layout/ProfilePhotoEditorModal";
import { CommunityStandardsModal } from "@/features/hoa/CommunityStandardsModal";
import {
  fetchCurrentUser,
  fetchMyHousehold,
  uploadMyProfilePhoto,
  type CurrentUser
} from "@/features/users/currentUserApi";

const links = [
  { to: "/community", label: "Home", icon: "/icon-home.svg" },
  { to: "/messages", label: "Messages", icon: "/icon-messages.svg" },
  { to: "/profile", label: "Profile", icon: "/icon-notifications.svg" },
  { to: "/map", label: "Map", icon: "/icon-notifications.svg" }
];

const boardLinks = [
  { to: "/community", label: "Community" },
  { to: "/services", label: "Services" },
  { to: "/garage-sales", label: "Garage Sales" },
  { to: "/alerts", label: "Alerts" },
  { to: "/reservations", label: "Reservations" }
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
  const [openDoc, setOpenDoc] = useState<null | "community-standards" | "forms">(null);
  const [photoDraft, setPhotoDraft] = useState<string | null>(null);

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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/silverleaf-icon.svg" alt="Silverleaf" className="h-9 w-9 rounded-lg shadow-sm" />
            <input
              placeholder="Find neighbors, topics, services..."
              className="w-72 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
            />
          </div>

          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex min-w-20 flex-col items-center rounded-lg px-3 py-2 text-xs font-medium transition ${
                    isActive ? "bg-leaf-50 text-leaf-900" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                <img src={link.icon} alt="" className="mb-1 h-5 w-5" />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
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
              className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <span>HOA</span>
              <span className={`text-xs transition-transform ${hoaExpanded ? "rotate-180" : ""}`}>v</span>
            </button>
            <div
              className={`overflow-hidden pl-3 transition-all duration-300 ${
                hoaExpanded ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
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
                onClick={() => setOpenDoc("forms")}
                className="mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
              >
                Forms
              </button>
            </div>

            {boardLinks.map((item) => (
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
      {openDoc === "forms" ? (
        <PdfDocumentModal
          title="Clubhouse Form"
          fileUrl="/hoa/ClubhouseForm.pdf"
          onClose={closeDocModal}
        />
      ) : null}
      {photoDraft ? (
        <ProfilePhotoEditorModal
          source={photoDraft}
          onCancel={() => setPhotoDraft(null)}
          onSave={saveProfilePhoto}
        />
      ) : null}
    </div>
  );
}
