import { Fragment, useMemo, useState } from "react";
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlightedText(content: string, query: string) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return content;
  }

  const matcher = new RegExp(`(${escapeRegExp(normalizedQuery)})`, "ig");
  const parts = content.split(matcher);

  return parts.map((part, index) => {
    if (part.toLowerCase() === normalizedQuery.toLowerCase()) {
      return (
        <mark
          key={`${part}-${index}`}
          className="rounded bg-amber-200 px-1 py-0.5 text-inherit"
        >
          {part}
        </mark>
      );
    }
    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
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
  onToggle,
  query
}: {
  section: StandardSection;
  expanded: boolean;
  onToggle: () => void;
  query: string;
}) {
  const formattedContent = section.content.replace(/ - /g, "\n- ");

  return (
    <article
      className={`overflow-hidden rounded-xl border ${
        section.highlight ? "border-rose-200 bg-rose-50/80" : "border-slate-200 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
          section.highlight ? "hover:bg-rose-100/70" : "hover:bg-leaf-50"
        }`}
      >
        <span className="min-w-10 text-xs font-semibold tracking-wide text-leaf-700">{section.number}</span>
        <span className="flex-1 text-sm font-semibold text-slate-900">{renderHighlightedText(section.title, query)}</span>
        {section.highlight ? (
          <span className="rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-700">
            VIOLATION
          </span>
        ) : null}
        <span className="text-xs font-semibold text-slate-500">{expanded ? "-" : "+"}</span>
      </button>
      {expanded ? (
        <p className="whitespace-pre-line border-t border-slate-200 px-4 py-3 text-sm leading-7 text-slate-700">
          {renderHighlightedText(formattedContent, query)}
        </p>
      ) : null}
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
        className="h-[90vh] w-[min(1220px,97vw)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[linear-gradient(135deg,_#f7fbf4_0%,_#eef6f0_45%,_#f8fafc_100%)] px-5 py-3">
          <div className="min-w-[220px]">
            <p className="text-xs uppercase tracking-[0.25em] text-leaf-700">Silverleaf Reserve HOA</p>
            <h3 className="text-lg font-semibold text-slate-900">Community Standards</h3>
          </div>
          <div className="min-w-[300px] flex-1">
            <input
              type="text"
              placeholder="Search standards..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none ring-leaf-600 placeholder:text-slate-400 focus:ring-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/hoa/CommunityStandards.pdf"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
            >
              Original PDF
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid h-[calc(90vh-74px)] grid-cols-1 md:grid-cols-[260px_1fr]">
          <aside className="border-r border-slate-200 bg-slate-50 p-4">
            <label className="mb-3 block text-xs uppercase tracking-[0.2em] text-slate-500">Sections</label>
            <div className="space-y-2">
              {COMMUNITY_STANDARDS.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => handleSectionNavClick(category.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-white hover:text-leaf-800"
                >
                  <span className="inline-flex min-w-10 justify-center rounded-md bg-white px-2 py-1 text-[11px] font-semibold tracking-wide text-leaf-700 shadow-sm">
                    {category.icon}
                  </span>
                  <span>{category.title}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="overflow-y-auto bg-white p-5">
            <div className="space-y-8">
              {filteredCategories.map((category) => (
                <section key={category.id} id={category.id} className="scroll-mt-4">
                  <header className="mb-3 border-b border-slate-200 pb-3">
                    <h4 className="text-xl font-semibold text-slate-900">
                      <span className="mr-2 inline-flex rounded-md bg-leaf-50 px-2 py-1 text-xs font-semibold tracking-wide text-leaf-700">
                        {category.icon}
                      </span>
                      {renderHighlightedText(category.title, query)}
                    </h4>
                    {category.intro ? (
                      <p className="mt-2 text-sm leading-7 text-slate-700">{renderHighlightedText(category.intro, query)}</p>
                    ) : null}
                  </header>

                  {category.items?.length ? (
                    <div className="mb-3 grid gap-3 sm:grid-cols-2">
                      {category.items.map((item) => (
                        <article key={item.term} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-leaf-700">{renderHighlightedText(item.term, query)}</p>
                          <p className="mt-1 text-sm leading-7 text-slate-700">{renderHighlightedText(item.definition, query)}</p>
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
                          query={query}
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
