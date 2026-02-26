import { useRef, useState } from "react";

type SectionItem = {
  id: string;
  title: string;
  summary: string;
  meta: string;
};

type SectionFeedPageProps = {
  heading: string;
  description: string;
  accentClass: string;
  items: SectionItem[];
  composerPlaceholder?: string;
};

export function SectionFeedPage({
  heading,
  description,
  accentClass,
  items,
  composerPlaceholder
}: SectionFeedPageProps) {
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedAttachmentsCount, setSelectedAttachmentsCount] = useState(0);

  const onAttachClick = () => {
    attachmentInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {composerPlaceholder ? (
        <section className="card p-4">
          <form className="flex items-center gap-2">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={composerPlaceholder}
                className="w-full rounded-full border border-slate-300 px-4 py-2 pr-12 text-sm outline-none ring-leaf-600 focus:ring-2"
              />
              <button
                type="button"
                onClick={onAttachClick}
                title="Attach image or video"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                <img src="/icon-attachment.png" alt="Attach media" className="h-5 w-5" />
              </button>
              <input
                ref={attachmentInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(event) => setSelectedAttachmentsCount(Array.from(event.target.files ?? []).length)}
              />
            </div>
            <button
              type="button"
              className="rounded-full bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700"
            >
              Post
            </button>
          </form>
          {selectedAttachmentsCount > 0 ? (
            <p className="mt-2 text-xs text-slate-500">{selectedAttachmentsCount} media item(s) attached</p>
          ) : null}
        </section>
      ) : null}

      <section className="card p-4">
        <div className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${accentClass}`}>
          {heading}
        </div>
        <h2 className="text-xl font-semibold text-slate-900">{heading} Feed</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </section>

      {items.map((item) => (
        <article key={item.id} className="card p-4">
          <header className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
            <span className="text-xs text-slate-500">{item.meta}</span>
          </header>
          <p className="text-sm text-slate-700">{item.summary}</p>
        </article>
      ))}
    </div>
  );
}
