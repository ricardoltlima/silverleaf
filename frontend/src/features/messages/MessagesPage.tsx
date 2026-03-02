import { useSearchParams } from "react-router-dom";
import { MessagesPanel } from "@/features/messages/MessagesPanel";

export function MessagesPage() {
  const [searchParams] = useSearchParams();
  const selectedUserIdParam = searchParams.get("user");
  const selectedUserId = selectedUserIdParam ? Number(selectedUserIdParam) : null;

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="mb-2 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
          Messages
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Resident Messages</h2>
        <p className="mt-1 text-sm text-slate-600">
          Chat with neighbors, sellers, and residents directly from your desktop feed.
        </p>
      </section>
      <MessagesPanel initialSelectedUserId={Number.isFinite(selectedUserId) ? selectedUserId : null} />
    </div>
  );
}
