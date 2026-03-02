import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllViolations, updateViolationStatus, type ViolationItem } from "@/features/board/boardApi";

const STATUS_OPTIONS: Array<ViolationItem["status"]> = ["OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"];

function statusBadge(status: ViolationItem["status"]) {
  if (status === "RESOLVED") return "bg-emerald-100 text-emerald-800";
  if (status === "IN_REVIEW") return "bg-amber-100 text-amber-800";
  if (status === "DISMISSED") return "bg-slate-200 text-slate-700";
  return "bg-rose-100 text-rose-800";
}

export function ViolationsPage() {
  const queryClient = useQueryClient();
  const violationsQuery = useQuery({
    queryKey: ["violations", "all"],
    queryFn: fetchAllViolations
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ViolationItem["status"] }) => updateViolationStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["violations"] })
  });

  const sortedViolations = useMemo(
    () => [...(violationsQuery.data ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [violationsQuery.data]
  );

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
          HOA Violations
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Violations</h2>
        <p className="mt-1 text-sm text-slate-600">
          HOA board can review submitted reports, inspect attached media, and update case status.
        </p>
      </section>

      <section className="card p-4">
        <h3 className="mb-2 text-base font-semibold text-slate-900">All reported violations</h3>
        {violationsQuery.isLoading ? <p className="text-sm text-slate-500">Loading violations...</p> : null}
        {violationsQuery.isError ? (
          <p className="text-sm text-rose-700">{(violationsQuery.error as Error).message}</p>
        ) : null}
        <div className="space-y-2">
          {sortedViolations.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                  #{item.id} - {new Date(item.createdAt).toLocaleString()} - {item.reporterName}
                </p>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusBadge(item.status)}`}>
                  {item.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-slate-800">{item.description}</p>
              {item.mediaUrls?.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {item.mediaUrls.map((url, index) =>
                    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url) ? (
                      <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={`Violation attachment ${index + 1}`} className="h-32 w-full rounded-lg border border-slate-200 object-contain bg-white" />
                      </a>
                    ) : /\.(mp4|webm|ogg|mov)$/i.test(url) ? (
                      <video key={`${url}-${index}`} src={url} controls className="h-32 w-full rounded-lg border border-slate-200 bg-slate-950 object-contain" />
                    ) : (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-32 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-leaf-700 hover:underline"
                      >
                        Open attachment
                      </a>
                    )
                  )}
                </div>
              ) : item.photoUrl ? (
                <a href={item.photoUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-leaf-700 hover:underline">
                  Open photo
                </a>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={`${item.id}-${status}`}
                    type="button"
                    disabled={item.status === status || updateStatusMutation.isPending}
                    onClick={() => updateStatusMutation.mutate({ id: item.id, status })}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
