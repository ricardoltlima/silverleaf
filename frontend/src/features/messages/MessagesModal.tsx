import { MessagesPanel } from "@/features/messages/MessagesPanel";

type MessagesModalProps = {
  open: boolean;
  onClose: () => void;
  initialSelectedUserId?: number | null;
};

export function MessagesModal({ open, onClose, initialSelectedUserId = null }: MessagesModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div onClick={(event) => event.stopPropagation()}>
        <MessagesPanel layout="modal" onClose={onClose} initialSelectedUserId={initialSelectedUserId} />
      </div>
    </div>
  );
}
