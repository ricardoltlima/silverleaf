import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createViolation, fetchMyViolations, type ViolationItem } from "@/features/board/boardApi";
import { uploadFeedMedia } from "@/features/feed/feedApi";

function statusBadge(status: ViolationItem["status"]) {
  if (status === "RESOLVED") return "bg-emerald-100 text-emerald-800";
  if (status === "IN_REVIEW") return "bg-amber-100 text-amber-800";
  if (status === "DISMISSED") return "bg-slate-200 text-slate-700";
  return "bg-rose-100 text-rose-800";
}

export function ReportViolationPage() {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const myViolationsQuery = useQuery({
    queryKey: ["violations", "mine"],
    queryFn: fetchMyViolations
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadFeedMedia(file, true),
    onSuccess: (uploaded) => {
      setMediaUrls((current) => [...current, uploaded.url]);
    }
  });

  const createMutation = useMutation({
    mutationFn: createViolation,
    onSuccess: () => {
      setDescription("");
      setMediaUrls([]);
      queryClient.invalidateQueries({ queryKey: ["violations", "mine"] });
    }
  });

  const sortedViolations = useMemo(
    () => [...(myViolationsQuery.data ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [myViolationsQuery.data]
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) return;
    createMutation.mutate({
      description: trimmed,
      photoUrl: mediaUrls[0] ?? null,
      mediaUrls
    });
  };

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
          HOA Reporting
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Report violation</h2>
        <p className="mt-1 text-sm text-slate-600">
          Send a message and media to HOA so they can review a violation report.
        </p>
      </section>

      <section className="card p-4">
        <h3 className="mb-2 text-base font-semibold text-slate-900">New report</h3>
        <form onSubmit={onSubmit} className="space-y-3">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Describe what happened, where, and when..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">Attachments</p>
                <p className="text-xs text-slate-500">Upload photos, videos, or documents for HOA.</p>
              </div>
              <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                Add media
                <input
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  multiple
                  className="hidden"
                  onChange={async (event) => {
                    const files = Array.from(event.target.files ?? []);
                    for (const file of files) {
                      await uploadMutation.mutateAsync(file);
                    }
                    event.target.value = "";
                  }}
                />
              </label>
            </div>

            {mediaUrls.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {mediaUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {/\.(mp4|webm|ogg|mov)$/i.test(url) ? (
                      <video src={url} controls className="h-40 w-full bg-slate-950 object-contain" />
                    ) : /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url) ? (
                      <img src={url} alt={`Attachment ${index + 1}`} className="h-40 w-full object-contain bg-slate-100" />
                    ) : (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-40 items-center justify-center px-4 text-sm font-medium text-leaf-700 hover:underline"
                      >
                        Open attachment
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      className="w-full border-t border-slate-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-70"
          >
            Submit report
          </button>
        </form>
      </section>

      <section className="card p-4">
        <h3 className="mb-2 text-base font-semibold text-slate-900">My reports</h3>
        {myViolationsQuery.isLoading ? <p className="text-sm text-slate-500">Loading reports...</p> : null}
        {myViolationsQuery.isError ? (
          <p className="text-sm text-rose-700">{(myViolationsQuery.error as Error).message}</p>
        ) : null}
        <div className="space-y-2">
          {sortedViolations.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500">#{item.id} - {new Date(item.createdAt).toLocaleString()}</p>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusBadge(item.status)}`}>
                  {item.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-slate-800">{item.description}</p>
              {item.mediaUrls?.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {item.mediaUrls.map((url: string, index: number) =>
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
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
