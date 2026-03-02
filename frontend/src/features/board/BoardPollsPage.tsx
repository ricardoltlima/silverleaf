import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPoll, fetchPolls } from "@/features/board/boardApi";
import { fetchCurrentUser } from "@/features/users/currentUserApi";
import { isHoaManager } from "@/features/users/roleUtils";

export function BoardPollsPage() {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchCurrentUser });
  const isAdmin = isHoaManager(meQuery.data?.role);
  const pollsQuery = useQuery({ queryKey: ["board", "polls"], queryFn: fetchPolls });
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);

  const createMutation = useMutation({
    mutationFn: createPoll,
    onSuccess: () => {
      setQuestion("");
      setOptions(["", ""]);
      queryClient.invalidateQueries({ queryKey: ["board", "polls"] });
      queryClient.invalidateQueries({ queryKey: ["alerts", "polls"] });
    }
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const cleanQuestion = question.trim();
    const cleanOptions = options.map((value) => value.trim()).filter((value) => value.length > 0);
    if (!cleanQuestion || cleanOptions.length < 2) return;
    createMutation.mutate({ question: cleanQuestion, options: cleanOptions });
  };

  return (
    <div className="space-y-4">
      {!isAdmin ? (
        <section className="card p-4 text-sm text-rose-700">Only HOA admins can access this page.</section>
      ) : null}
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">Board</div>
        <h2 className="text-xl font-semibold text-slate-900">Polls</h2>
        <p className="mt-1 text-sm text-slate-600">Create HOA polls and invite eligible residents to vote.</p>
      </section>

      <section className={`card p-4 ${isAdmin ? "" : "pointer-events-none opacity-60"}`}>
        <h3 className="mb-2 text-base font-semibold text-slate-900">Create poll</h3>
        <form onSubmit={onSubmit} className="space-y-2">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Poll question"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
          />
          {options.map((option, index) => (
            <input
              key={`option-${index + 1}`}
              value={option}
              onChange={(event) =>
                setOptions((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
              }
              placeholder={`Option ${index + 1}`}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-leaf-600 focus:ring-2"
            />
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOptions((current) => [...current, ""])}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Add option
            </button>
            {options.length > 2 ? (
              <button
                type="button"
                onClick={() => setOptions((current) => current.slice(0, -1))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Remove option
              </button>
            ) : null}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-leaf-600 px-4 py-2 text-xs font-semibold text-white hover:bg-leaf-700 disabled:opacity-70"
            >
              Publish poll
            </button>
          </div>
        </form>
      </section>

      <section className={`card p-4 ${isAdmin ? "" : "pointer-events-none opacity-60"}`}>
        <h3 className="mb-2 text-base font-semibold text-slate-900">Active polls</h3>
        {pollsQuery.isLoading ? <p className="text-sm text-slate-500">Loading...</p> : null}
        {pollsQuery.isError ? <p className="text-sm text-rose-700">{(pollsQuery.error as Error).message}</p> : null}
        <div className="space-y-2">
          {(pollsQuery.data ?? []).map((poll) => {
            const totalVotes = poll.voteCounts.reduce((sum, value) => sum + value, 0);
            return (
              <article key={poll.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{poll.question}</p>
                <p className="mt-1 text-xs text-slate-500">{totalVotes} vote(s)</p>
                <ul className="mt-2 space-y-1">
                  {poll.options.map((option, index) => (
                    <li key={`${poll.id}-${index}`} className="text-sm text-slate-700">
                      {option}: {poll.voteCounts[index] ?? 0}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
