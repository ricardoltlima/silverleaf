import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchNeighbors, type NeighborListItem } from "@/features/neighbors/neighborsApi";

const defaultAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' fill='%23d6e6f8'/%3E%3Ccircle cx='36' cy='27' r='14' fill='%23a5bfdc'/%3E%3Cellipse cx='36' cy='60' rx='22' ry='14' fill='%23a5bfdc'/%3E%3C/svg%3E";

export function NeighborsPage() {
  const [query, setQuery] = useState("");
  const neighborsQuery = useQuery({
    queryKey: ["neighbors"],
    queryFn: fetchNeighbors
  });

  const filteredNeighbors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const neighbors = neighborsQuery.data ?? [];
    if (!normalizedQuery) {
      return neighbors;
    }
    return neighbors.filter((neighbor) =>
      [neighbor.fullName, neighbor.address ?? "", neighbor.serviceTitle ?? ""]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [neighborsQuery.data, query]);

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          Neighbors
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Resident Directory</h2>
        <p className="mt-1 text-sm text-slate-600">
          Browse residents, open their profiles, and contact them directly.
        </p>
        <div className="mt-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, address, or service"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-leaf-600 focus:ring-2"
          />
        </div>
      </section>

      {neighborsQuery.isLoading ? (
        <section className="card p-6 text-sm text-slate-600">Loading neighbors...</section>
      ) : null}
      {neighborsQuery.isError ? (
        <section className="card p-6 text-sm text-rose-700">{(neighborsQuery.error as Error).message}</section>
      ) : null}

      {!neighborsQuery.isLoading && !neighborsQuery.isError ? (
        filteredNeighbors.length === 0 ? (
          <section className="card p-6 text-sm text-slate-600">No neighbors matched your search.</section>
        ) : (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredNeighbors.map((neighbor: NeighborListItem) => (
              <article key={neighbor.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <Link to={`/neighbors/${neighbor.id}`} className="shrink-0">
                    <img
                      src={neighbor.photoUrl || defaultAvatar}
                      alt={`${neighbor.fullName} profile`}
                      className="h-16 w-16 rounded-full border border-slate-200 object-cover shadow-sm"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/neighbors/${neighbor.id}`} className="text-base font-semibold text-slate-900 hover:text-leaf-700">
                      {neighbor.fullName}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">{neighbor.address || "Address not available"}</p>
                    {neighbor.serviceEnabled && neighbor.serviceTitle ? (
                      <p className="mt-2 inline-flex rounded-full bg-leaf-50 px-2 py-1 text-xs font-semibold text-leaf-800">
                        {neighbor.serviceTitle}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">No service listed</p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )
      ) : null}
    </div>
  );
}
