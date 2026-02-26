type PdfDocumentModalProps = {
  title: string;
  fileUrl: string;
  onClose: () => void;
};

export function PdfDocumentModal({ title, fileUrl, onClose }: PdfDocumentModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="h-[88vh] w-[min(1100px,96vw)] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
            >
              Open new tab
            </a>
            <a
              href={fileUrl}
              download
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
            >
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
        <div className="h-[calc(88vh-57px)] bg-slate-100 p-2">
          <div className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white">
            <iframe title={title} src={fileUrl} className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
