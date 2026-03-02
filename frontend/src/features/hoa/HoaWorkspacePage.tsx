import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateManagedResident,
  createResidentInvitation,
  deactivateManagedResident,
  fetchHousesForHoaDesk,
  fetchManagedResidents,
  updateManagedResident,
  type ResidentDirectoryItem
} from "@/features/hoa/hoaApi";
import { fetchCurrentUser } from "@/features/users/currentUserApi";
import { isHoaManager, isSystemAdmin, roleLabel, type UserRole } from "@/features/users/roleUtils";

type EditableResident = {
  fullName: string;
  email: string;
  role: UserRole;
  password: string;
};

const roleOptions: UserRole[] = ["RESIDENT", "TENANT", "HOA_ADMIN", "ADMIN"];

export function HoaWorkspacePage() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchCurrentUser });
  const [search, setSearch] = useState("");
  const [inviteForm, setInviteForm] = useState({
    fullName: "",
    email: "",
    password: "myPassw0rd!",
    houseId: 0,
    role: "RESIDENT" as Exclude<UserRole, "ADMIN">
  });
  const [inviteUrl, setInviteUrl] = useState("");
  const [editingResidentId, setEditingResidentId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditableResident | null>(null);

  const canManageHoa = isHoaManager(meQuery.data?.role);
  const canAssignSystemAdmin = isSystemAdmin(meQuery.data?.role);

  const residentsQuery = useQuery({
    queryKey: ["hoa", "residents", search],
    queryFn: () => fetchManagedResidents(search),
    enabled: canManageHoa
  });
  const housesQuery = useQuery({
    queryKey: ["hoa", "houses"],
    queryFn: fetchHousesForHoaDesk,
    enabled: canManageHoa
  });

  const inviteMutation = useMutation({
    mutationFn: createResidentInvitation,
    onSuccess: (result) => {
      setInviteUrl(result.invitationUrl);
      setInviteForm((current) => ({ ...current, fullName: "", email: "", password: "myPassw0rd!" }));
      queryClient.invalidateQueries({ queryKey: ["hoa", "residents"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ residentId, payload }: { residentId: number; payload: EditableResident }) =>
      updateManagedResident(residentId, {
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password.trim() ? payload.password : null,
        role: payload.role
      }),
    onSuccess: () => {
      setEditingResidentId(null);
      setEditForm(null);
      queryClient.invalidateQueries({ queryKey: ["hoa", "residents"] });
    }
  });

  const toggleEnabledMutation = useMutation({
    mutationFn: ({ residentId, enabled }: { residentId: number; enabled: boolean }) =>
      enabled ? deactivateManagedResident(residentId) : activateManagedResident(residentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hoa", "residents"] });
    }
  });

  const visibleRoleOptions = useMemo(
    () => roleOptions.filter((role) => canAssignSystemAdmin || role !== "ADMIN"),
    [canAssignSystemAdmin]
  );

  const onSubmitInvite = (event: FormEvent) => {
    event.preventDefault();
    if (!inviteForm.fullName.trim() || !inviteForm.email.trim() || !inviteForm.password.trim() || !inviteForm.houseId) {
      return;
    }
    inviteMutation.mutate({
      fullName: inviteForm.fullName.trim(),
      email: inviteForm.email.trim(),
      password: inviteForm.password,
      houseId: inviteForm.houseId,
      role: inviteForm.role
    });
  };

  const startEditing = (resident: ResidentDirectoryItem) => {
    setEditingResidentId(resident.id);
    setEditForm({
      fullName: resident.fullName,
      email: resident.email,
      role: resident.role,
      password: ""
    });
  };

  if (!canManageHoa) {
    return <section className="card p-4 text-sm text-rose-700">Only HOA managers can access this workspace.</section>;
  }

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
          HOA Workspace
        </div>
        <h2 className="text-xl font-semibold text-slate-900">HOA Operations</h2>
        <p className="mt-1 text-sm text-slate-600">
          Invite new community members, assign resident or tenant status, and keep HOA operations in one place.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link to="/board/news" className="rounded-full border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
            Board News
          </Link>
          <Link to="/board/broadcasts" className="rounded-full border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
            Message Everyone
          </Link>
          <Link to="/board/polls" className="rounded-full border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
            Polls
          </Link>
          <Link to="/violations" className="rounded-full border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
            Violations
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-4">
          <h3 className="mb-2 text-base font-semibold text-slate-900">Send resident invitation</h3>
          <form onSubmit={onSubmitInvite} className="grid gap-3 md:grid-cols-2">
            <input
              value={inviteForm.fullName}
              onChange={(event) => setInviteForm((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Full name"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
            />
            <input
              value={inviteForm.email}
              onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
            />
            <input
              value={inviteForm.password}
              onChange={(event) => setInviteForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Temporary password"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
            />
            <select
              value={inviteForm.role}
              onChange={(event) =>
                setInviteForm((current) => ({
                  ...current,
                  role: event.target.value as Exclude<UserRole, "ADMIN">
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
            >
              <option value="RESIDENT">Resident</option>
              <option value="TENANT">Tenant</option>
              {canAssignSystemAdmin ? <option value="HOA_ADMIN">HOA Admin</option> : null}
            </select>
            <select
              value={inviteForm.houseId || ""}
              onChange={(event) => setInviteForm((current) => ({ ...current, houseId: Number(event.target.value) }))}
              className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
            >
              <option value="">Select address</option>
              {(housesQuery.data ?? []).map((house) => (
                <option key={house.id} value={house.id}>
                  {house.address}
                </option>
              ))}
            </select>
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={inviteMutation.isPending}
                className="rounded-lg bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-70"
              >
                {inviteMutation.isPending ? "Sending..." : "Create invite"}
              </button>
              {inviteMutation.isError ? <span className="text-sm text-rose-700">{(inviteMutation.error as Error).message}</span> : null}
            </div>
          </form>
        </div>

        <div className="card p-4">
          <h3 className="mb-2 text-base font-semibold text-slate-900">Latest invite link</h3>
          <p className="text-sm text-slate-600">
            Email delivery can be wired later. For local testing, copy the generated link below and open it in the browser.
          </p>
          <textarea
            readOnly
            value={inviteUrl}
            rows={6}
            className="mt-3 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
          />
        </div>
      </section>

      <section className="card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Community members</h3>
            <p className="text-sm text-slate-600">Residents, tenants, and HOA admins that belong to this community.</p>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
          />
        </div>

        {residentsQuery.isLoading ? <p className="text-sm text-slate-500">Loading members...</p> : null}
        {residentsQuery.isError ? <p className="text-sm text-rose-700">{(residentsQuery.error as Error).message}</p> : null}

        <div className="space-y-2">
          {(residentsQuery.data ?? []).map((resident) => {
            const editing = editingResidentId === resident.id && editForm !== null;
            return (
              <article key={resident.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                {editing ? (
                  <div className="grid gap-2 md:grid-cols-[1fr_1fr_180px]">
                    <input
                      value={editForm.fullName}
                      onChange={(event) => setEditForm((current) => (current ? { ...current, fullName: event.target.value } : current))}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
                    />
                    <input
                      value={editForm.email}
                      onChange={(event) => setEditForm((current) => (current ? { ...current, email: event.target.value } : current))}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
                    />
                    <select
                      value={editForm.role}
                      onChange={(event) => setEditForm((current) => (current ? { ...current, role: event.target.value as UserRole } : current))}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
                    >
                      {visibleRoleOptions.map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                    </select>
                    <input
                      value={editForm.password}
                      onChange={(event) => setEditForm((current) => (current ? { ...current, password: event.target.value } : current))}
                      placeholder="New password (optional)"
                      className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateMutation.mutate({ residentId: resident.id, payload: editForm })}
                        disabled={updateMutation.isPending}
                        className="rounded-lg bg-leaf-600 px-3 py-2 text-xs font-semibold text-white hover:bg-leaf-700 disabled:opacity-70"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingResidentId(null);
                          setEditForm(null);
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{resident.fullName}</p>
                      <p className="mt-1 text-xs text-slate-500">{resident.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700">
                        {roleLabel(resident.role)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                          resident.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {resident.enabled ? "Active" : "Inactive"}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEditing(resident)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={toggleEnabledMutation.isPending}
                        onClick={() => toggleEnabledMutation.mutate({ residentId: resident.id, enabled: resident.enabled })}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {resident.enabled ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
