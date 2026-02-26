import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFeed } from "@/features/feed/feedApi";
import {
  fetchCurrentUser,
  fetchMyProfile,
  updateMyProfile,
  uploadMyProfilePhoto
} from "@/features/users/currentUserApi";

const HARD_CODED_ADDRESS = "002 Silverleaf Lane";

type PersonalForm = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
};

type ServiceForm = {
  enabled: boolean;
  title: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
  businessUrl: string;
  hours: string;
  serviceArea: string;
  visibility: "PUBLIC" | "GROUPS";
};

export function ProfilePage() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchCurrentUser
  });
  const profileQuery = useQuery({
    queryKey: ["me-profile"],
    queryFn: fetchMyProfile
  });
  const communityFeedQuery = useQuery({
    queryKey: ["feed", "community", "profile-stats"],
    queryFn: () => fetchFeed(100, "COMMUNITY"),
    staleTime: 60_000
  });
  const servicesFeedQuery = useQuery({
    queryKey: ["feed", "services", "profile-stats"],
    queryFn: () => fetchFeed(100, "SERVICES"),
    staleTime: 60_000
  });

  const [personal, setPersonal] = useState<PersonalForm>({
    fullName: "",
    email: "",
    phone: "",
    address: HARD_CODED_ADDRESS
  });
  const [service, setService] = useState<ServiceForm>({
    enabled: false,
    title: "",
    description: "",
    contactPhone: "",
    contactEmail: "",
    businessUrl: "",
    hours: "",
    serviceArea: "Silverleaf Reserve",
    visibility: "PUBLIC"
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const uploadPhotoMutation = useMutation({
    mutationFn: uploadMyProfilePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["me-profile"] });
      queryClient.invalidateQueries({ queryKey: ["feed", "services"] });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["me-profile"], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["feed", "services"] });
      setSavedAt(new Date().toLocaleTimeString());
    }
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    setPersonal((current) => ({
      ...current,
      fullName: profileQuery.data.fullName || "",
      email: profileQuery.data.email || "",
      phone: profileQuery.data.phoneNumber || ""
    }));
    setService({
      enabled: profileQuery.data.serviceEnabled,
      title: profileQuery.data.serviceTitle || "",
      description: profileQuery.data.serviceDescription || "",
      contactPhone: profileQuery.data.serviceContactPhone || "",
      contactEmail: profileQuery.data.serviceContactEmail || profileQuery.data.email || "",
      businessUrl: profileQuery.data.serviceBusinessUrl || "",
      hours: profileQuery.data.serviceHours || "",
      serviceArea: profileQuery.data.serviceArea || "Silverleaf Reserve",
      visibility: profileQuery.data.serviceVisibility || "PUBLIC"
    });
  }, [profileQuery.data]);

  const communityPosts = communityFeedQuery.data?.items ?? [];
  const servicesPosts = servicesFeedQuery.data?.items ?? [];
  const myCommunityPosts = communityPosts.filter((post) => post.authorUserId === meQuery.data?.id).length;
  const myServicePosts = servicesPosts.filter((post) => post.authorUserId === meQuery.data?.id).length;

  const onSaveProfile = () => {
    updateProfileMutation.mutate({
      fullName: personal.fullName,
      email: personal.email,
      phoneNumber: personal.phone || null,
      password: null,
      serviceEnabled: service.enabled,
      serviceTitle: service.title || null,
      serviceDescription: service.description || null,
      serviceContactPhone: service.contactPhone || null,
      serviceContactEmail: service.contactEmail || null,
      serviceBusinessUrl: service.businessUrl || null,
      serviceHours: service.hours || null,
      serviceArea: service.serviceArea || null,
      serviceVisibility: service.visibility
    });
  };

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Resident Profile
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Your Profile</h2>
        <p className="mt-1 text-sm text-slate-600">
          Update your personal details and optionally advertise services to neighbors.
        </p>
      </section>

      <section className="card p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-900">Personal Information</h3>
        <div className="mb-4 flex items-center gap-3">
          <img
            src={
              meQuery.data?.photoUrl ||
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' fill='%23d6e6f8'/%3E%3Ccircle cx='36' cy='27' r='14' fill='%23a5bfdc'/%3E%3Cellipse cx='36' cy='60' rx='22' ry='14' fill='%23a5bfdc'/%3E%3C/svg%3E"
            }
            alt="Profile"
            className="h-16 w-16 rounded-full border border-slate-200 object-cover shadow-sm"
          />
          <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Change photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                uploadPhotoMutation.mutate(file);
                event.target.value = "";
              }}
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Full name</span>
            <input
              value={personal.fullName}
              onChange={(event) => setPersonal((current) => ({ ...current, fullName: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Email</span>
            <input
              value={personal.email}
              onChange={(event) => setPersonal((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Phone</span>
            <input
              value={personal.phone}
              onChange={(event) => setPersonal((current) => ({ ...current, phone: event.target.value }))}
              placeholder="(555) 123-4567"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Address (read-only)</span>
            <input
              value={personal.address}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600"
            />
          </label>
        </div>
      </section>

      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Service Provider</h3>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={service.enabled}
              onChange={(event) => setService((current) => ({ ...current, enabled: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-leaf-700 focus:ring-leaf-600"
            />
            I provide services to neighbors
          </label>
        </div>

        {service.enabled ? (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-slate-600">Service title</span>
              <input
                value={service.title}
                onChange={(event) => setService((current) => ({ ...current, title: event.target.value }))}
                placeholder="Electrical Repairs, Lawn Care, Tutoring..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-slate-600">Description</span>
              <textarea
                value={service.description}
                onChange={(event) => setService((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Contact phone</span>
              <input
                value={service.contactPhone}
                onChange={(event) => setService((current) => ({ ...current, contactPhone: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Contact email</span>
              <input
                value={service.contactEmail}
                onChange={(event) => setService((current) => ({ ...current, contactEmail: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Business URL</span>
              <input
                value={service.businessUrl}
                onChange={(event) => setService((current) => ({ ...current, businessUrl: event.target.value }))}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Hours</span>
              <input
                value={service.hours}
                onChange={(event) => setService((current) => ({ ...current, hours: event.target.value }))}
                placeholder="Mon-Fri 8am-6pm"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Service area</span>
              <input
                value={service.serviceArea}
                onChange={(event) => setService((current) => ({ ...current, serviceArea: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Visibility</span>
              <select
                value={service.visibility}
                onChange={(event) =>
                  setService((current) => ({
                    ...current,
                    visibility: event.target.value as ServiceForm["visibility"]
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              >
                <option value="PUBLIC">Public to all residents</option>
                <option value="GROUPS">Only my groups</option>
              </select>
            </label>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Turn this on to publish your service details so neighbors can contact you.
          </p>
        )}
      </section>

      <section className="card p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-900">Trust & Activity</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Member since</p>
            <p className="text-sm font-semibold text-slate-900">2026</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Community posts</p>
            <p className="text-sm font-semibold text-slate-900">{myCommunityPosts}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Service posts</p>
            <p className="text-sm font-semibold text-slate-900">{myServicePosts}</p>
          </div>
        </div>
      </section>

      <section className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSaveProfile}
            disabled={updateProfileMutation.isPending}
            className="rounded-lg bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-70"
          >
            Save profile
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Create service post
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Share profile
          </button>
          {updateProfileMutation.isError ? (
            <span className="text-xs text-red-600">
              {(updateProfileMutation.error as Error).message}
            </span>
          ) : null}
          {savedAt ? <span className="text-xs text-slate-500">Saved at {savedAt}</span> : null}
        </div>
      </section>
    </div>
  );
}
