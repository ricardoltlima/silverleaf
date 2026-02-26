import { useMemo, useState } from "react";
import {
  COMMUNITY_STANDARDS,
  type StandardCategory,
  type StandardSection
} from "@/features/hoa/communityStandardsData";

type CommunityStandardsModalProps = {
  onClose: () => void;
};

function matchesQuery(query: string, content: string) {
  return content.toLowerCase().includes(query.toLowerCase());
}

function filterCategory(category: StandardCategory, query: string): StandardCategory | null {
  if (!query.trim()) {
    return category;
  }

  const filteredItems = category.items?.filter(
    (item) => matchesQuery(query, item.term) || matchesQuery(query, item.definition)
  );
  const filteredSections = category.sections?.filter(
    (section) => matchesQuery(query, section.title) || matchesQuery(query, section.content)
  );
  const includeByTitle =
    matchesQuery(query, category.title) || (category.intro ? matchesQuery(query, category.intro) : false);

  if (includeByTitle || (filteredItems && filteredItems.length) || (filteredSections && filteredSections.length)) {
    return {
      ...category,
      items: filteredItems,
      sections: filteredSections
    };
  }

  return null;
}

function SectionCard({
  section,
  expanded,
  onToggle
}: {
  section: StandardSection;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      className={`overflow-hidden rounded-xl border ${
        section.highlight ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <span className="min-w-10 text-xs font-semibold tracking-wide text-emerald-700">{section.number}</span>
        <span className="flex-1 text-sm font-semibold text-slate-900">{section.title}</span>
        {section.highlight ? (
          <span className="rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-700">
            VIOLATION
          </span>
        ) : null}
        <span className="text-xs text-slate-500">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded ? <p className="border-t border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700">{section.content}</p> : null}
    </article>
  );
}

export function CommunityStandardsModal({ onClose }: CommunityStandardsModalProps) {
  const [query, setQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const filteredCategories = useMemo(
    () =>
      COMMUNITY_STANDARDS.map((category) => filterCategory(category, query)).filter(
        (value): value is StandardCategory => Boolean(value)
      ),
    [query]
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections((current) => ({ ...current, [sectionId]: !current[sectionId] }));
  };

  const handleSectionNavClick = (categoryId: string) => {
    if (query) {
      setQuery("");
      requestAnimationFrame(() => {
        document.getElementById(categoryId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    document.getElementById(categoryId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="h-[90vh] w-[min(1220px,97vw)] overflow-hidden rounded-2xl bg-slate-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-3">
          <div className="min-w-[220px]">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-400">Silverleaf Reserve HOA</p>
            <h3 className="text-lg font-semibold text-white">Community Standards</h3>
          </div>
          <div className="min-w-[300px] flex-1">
            <input
              type="text"
              placeholder="Search standards..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 outline-none ring-emerald-600 placeholder:text-slate-400 focus:ring-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/hoa/CommunityStandards.pdf"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
            >
              Original PDF
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid h-[calc(90vh-74px)] grid-cols-1 md:grid-cols-[260px_1fr]">
          <aside className="border-r border-slate-800 bg-slate-900 p-4">
            <label className="mb-3 block text-xs uppercase tracking-[0.2em] text-slate-400">Sections</label>
            <div className="space-y-2">
              {COMMUNITY_STANDARDS.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => handleSectionNavClick(category.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <span>{category.icon}</span>
                  <span>{category.title}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="overflow-y-auto bg-slate-100 p-5">
            <div className="space-y-8">
              {filteredCategories.map((category) => (
                <section key={category.id} id={category.id} className="scroll-mt-4">
                  <header className="mb-3 border-b border-slate-300 pb-3">
                    <h4 className="text-xl font-semibold text-slate-900">
                      <span className="mr-2">{category.icon}</span>
                      {category.title}
                    </h4>
                    {category.intro ? <p className="mt-2 text-sm leading-6 text-slate-700">{category.intro}</p> : null}
                  </header>

                  {category.items?.length ? (
                    <div className="mb-3 grid gap-3 sm:grid-cols-2">
                      {category.items.map((item) => (
                        <article key={item.term} className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="text-sm font-semibold text-amber-700">{item.term}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">{item.definition}</p>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  {category.sections?.length ? (
                    <div className="space-y-2">
                      {category.sections.map((section) => (
                        <SectionCard
                          key={section.number}
                          section={section}
                          expanded={Boolean(openSections[section.number]) || Boolean(query)}
                          onToggle={() => toggleSection(section.number)}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
