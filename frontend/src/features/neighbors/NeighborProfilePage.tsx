import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchNeighborProfile } from "@/features/neighbors/neighborsApi";

const defaultAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' fill='%23d6e6f8'/%3E%3Ccircle cx='36' cy='27' r='14' fill='%23a5bfdc'/%3E%3Cellipse cx='36' cy='60' rx='22' ry='14' fill='%23a5bfdc'/%3E%3C/svg%3E";

export function NeighborProfilePage() {
  const params = useParams<{ neighborId: string }>();
  const neighborId = Number(params.neighborId);
  const profileQuery = useQuery({
    queryKey: ["neighbors", neighborId],
    queryFn: () => fetchNeighborProfile(neighborId),
    enabled: Number.isFinite(neighborId)
  });

  if (!Number.isFinite(neighborId)) {
    return <section className="card p-6 text-sm text-rose-700">Invalid neighbor profile.</section>;
  }

  if (profileQuery.isLoading) {
    return <section className="card p-6 text-sm text-slate-600">Loading neighbor profile...</section>;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <section className="card p-6 text-sm text-rose-700">{(profileQuery.error as Error)?.message || "Neighbor not found."}</section>;
  }

  const profile = profileQuery.data;

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <Link to="/neighbors" className="text-sm font-medium text-leaf-700 hover:text-leaf-800">
          Back to neighbors
        </Link>
      </section>

      <section className="card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <img
              src={profile.photoUrl || defaultAvatar}
              alt={`${profile.fullName} profile`}
              className="h-24 w-24 rounded-full border border-slate-200 object-cover shadow-sm"
            />
            <div>
              <div className="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                Neighbor Profile
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">{profile.fullName}</h2>
              <p className="mt-1 text-sm text-slate-600">{profile.address || "Address not available"}</p>
              <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("silverleaf-open-messages", { detail: profile.id }))
            }
            className="rounded-xl bg-leaf-600 px-4 py-3 text-sm font-medium text-white hover:bg-leaf-700"
          >
            Send a message
          </button>
        </div>
      </section>

      <section className="card p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-900">Personal Information</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Full name</p>
            <p className="text-sm font-semibold text-slate-900">{profile.fullName}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Address</p>
            <p className="text-sm font-semibold text-slate-900">{profile.address || "Not available"}</p>
          </div>
        </div>
      </section>

      <section className="card p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-900">Service</h3>
        {profile.serviceEnabled ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-2">
              <p className="text-xs text-slate-500">Title</p>
              <p className="text-sm font-semibold text-slate-900">{profile.serviceTitle || "Service listed"}</p>
              {profile.serviceDescription ? (
                <p className="mt-2 text-sm text-slate-700">{profile.serviceDescription}</p>
              ) : null}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Contact</p>
              <p className="text-sm font-semibold text-slate-900">{profile.serviceContactPhone || "No phone listed"}</p>
              <p className="mt-1 text-sm text-slate-600">{profile.serviceContactEmail || profile.email}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Hours</p>
              <p className="text-sm font-semibold text-slate-900">{profile.serviceHours || "Not provided"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Business page</p>
              {profile.serviceBusinessUrl ? (
                <a
                  href={profile.serviceBusinessUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-leaf-700 hover:text-leaf-800"
                >
                  Open business page
                </a>
              ) : (
                <p className="text-sm font-semibold text-slate-900">Not provided</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">This neighbor has not listed a service yet.</p>
        )}
      </section>
    </div>
  );
}
