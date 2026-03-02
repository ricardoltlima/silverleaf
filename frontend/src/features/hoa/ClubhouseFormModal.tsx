import { Fragment, useMemo, useState } from "react";
import {
  CLUBHOUSE_FORM_INTRO,
  CLUBHOUSE_FORM_SECTIONS,
  type ClubhouseFormSection
} from "@/features/hoa/clubhouseFormData";

type ClubhouseFormModalProps = {
  onClose: () => void;
};

type ClubhouseReservationForm = {
  applicationDate: string;
  name: string;
  phone: string;
  address: string;
  email: string;
  typeOfFunction: string;
  guestCount: string;
  rentalFeeCheck: string;
  depositCheck: string;
  renterInitials: string;
  signatureName: string;
  signatureDate: string;
  homeownerSignatureName: string;
  homeownerSignatureDate: string;
};

const initialFormState: ClubhouseReservationForm = {
  applicationDate: "",
  name: "",
  phone: "",
  address: "",
  email: "",
  typeOfFunction: "",
  guestCount: "",
  rentalFeeCheck: "",
  depositCheck: "",
  renterInitials: "",
  signatureName: "",
  signatureDate: "",
  homeownerSignatureName: "",
  homeownerSignatureDate: ""
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
        <mark key={`${part}-${index}`} className="rounded bg-amber-200 px-1 py-0.5 text-inherit">
          {part}
        </mark>
      );
    }
    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function filterSections(query: string): ClubhouseFormSection[] {
  if (!query.trim()) {
    return CLUBHOUSE_FORM_SECTIONS;
  }
  return CLUBHOUSE_FORM_SECTIONS.filter(
    (section) => matchesQuery(query, section.title) || matchesQuery(query, section.content)
  );
}

function FormSectionCard({
  section,
  query,
  form,
  updateField
}: {
  section: ClubhouseFormSection;
  query: string;
  form: ClubhouseReservationForm;
  updateField: <K extends keyof ClubhouseReservationForm>(field: K, value: ClubhouseReservationForm[K]) => void;
}) {
  if (section.id === "application-fields") {
    return (
      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-leaf-50 px-4 py-3">
          <h4 className="text-sm font-semibold text-slate-900">{renderHighlightedText(section.title, query)}</h4>
        </div>
        <div className="space-y-4 px-4 py-4">
          <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
            {renderHighlightedText(
              `All Homeowners are required to be current on dues and compliant with the rules and regulations.
$250.00 Rental Check and a $250 Deposit Check must accompany this application. Please write 2 separate Checks. All Checks must be made out to Silverleaf Reserve Homeowners Association, Inc.`,
              query
            )}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Date of Application</span>
              <input
                type="date"
                value={form.applicationDate}
                onChange={(event) => updateField("applicationDate", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Name</span>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Phone #</span>
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Address</span>
              <input
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Email</span>
              <input
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Type of Function</span>
              <input
                value={form.typeOfFunction}
                onChange={(event) => updateField("typeOfFunction", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Number of guests</span>
              <input
                value={form.guestCount}
                onChange={(event) => updateField("guestCount", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Rental Fee Check #</span>
              <input
                value={form.rentalFeeCheck}
                onChange={(event) => updateField("rentalFeeCheck", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              <span className="mb-1 block font-medium">Deposit Check #</span>
              <input
                value={form.depositCheck}
                onChange={(event) => updateField("depositCheck", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-leaf-600 focus:ring-2"
              />
            </label>
          </div>

          <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
            {renderHighlightedText(
              `(initial here) I have read, signed and fully understand the attached rules and agree to abide by them during the rental period. I understand that I will be responsible for all damages to the clubhouse during the rental period. Silverleaf HOA and HomeRiver Group are not responsible for any articles that may be left behind or thrown away as a result of the renter not removing them when they depart.

Signature
Date
Homeowner Signature (or attach approval email)
Date`,
              query
            )}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-leaf-50 px-4 py-3">
        <h4 className="text-sm font-semibold text-slate-900">{renderHighlightedText(section.title, query)}</h4>
      </div>
      <p className="whitespace-pre-line px-4 py-4 text-sm leading-7 text-slate-700">
        {renderHighlightedText(section.content, query)}
      </p>
    </article>
  );
}

export function ClubhouseFormModal({ onClose }: ClubhouseFormModalProps) {
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<ClubhouseReservationForm>(initialFormState);

  const filteredSections = useMemo(() => filterSections(query), [query]);

  const scrollToSection = (sectionId: string) => {
    if (query) {
      setQuery("");
      requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updateField = <K extends keyof ClubhouseReservationForm>(field: K, value: ClubhouseReservationForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=980,height=900");
    if (!printWindow) {
      return;
    }

    const renderField = (label: string, value: string) =>
      `<div style="margin-bottom:12px;"><strong>${label}:</strong> <span>${value || "____________________________"}</span></div>`;

    const sectionsHtml = CLUBHOUSE_FORM_SECTIONS.filter((section) => section.id !== "application-fields").map(
      (section) => `
        <section style="margin-top:18px; border:1px solid #cbd5e1; border-radius:16px; overflow:hidden;">
          <div style="border-bottom:1px solid #cbd5e1; background:#eef6f0; padding:12px 16px;">
            <h3 style="font-size:16px; margin:0; color:#0f172a;">${section.title}</h3>
          </div>
          <div style="white-space:pre-line; line-height:1.7; color:#334155; font-size:13px; padding:16px;">${section.content}</div>
        </section>
      `
    ).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Clubhouse Form</title>
          <style>
            body { font-family: Georgia, 'Times New Roman', serif; margin: 32px; color: #0f172a; }
            h1 { margin: 0 0 6px; font-size: 28px; }
            h2 { margin: 0 0 16px; font-size: 16px; font-weight: normal; color: #475569; }
            .section { border: 1px solid #cbd5e1; border-radius: 16px; margin-top: 18px; overflow: hidden; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; }
            .intro { white-space: pre-line; line-height: 1.7; font-size: 13px; color: #334155; }
            .section-header { border-bottom: 1px solid #cbd5e1; background: #eef6f0; padding: 12px 16px; }
            .section-body { padding: 16px 18px; }
            @media print { body { margin: 18px; } }
          </style>
        </head>
        <body>
          <h1>Silverleaf Reserve HOA</h1>
          <h2>Clubhouse Reservation Application and Agreement</h2>
          <div class="intro">${CLUBHOUSE_FORM_INTRO}</div>
          <div class="section">
            <div class="section-header">
              <h3 style="margin:0; font-size:16px; color:#0f172a;">Application Fields</h3>
            </div>
            <div class="section-body">
              <div style="white-space:pre-line; line-height:1.7; color:#334155; font-size:13px; margin-bottom:16px;">All Homeowners are required to be current on dues and compliant with the rules and regulations.
$250.00 Rental Check and a $250 Deposit Check must accompany this application. Please write 2 separate Checks. All Checks must be made out to Silverleaf Reserve Homeowners Association, Inc.</div>
              <div class="grid">
                ${renderField("Date of Application", form.applicationDate)}
                ${renderField("Name", form.name)}
                ${renderField("Phone #", form.phone)}
                ${renderField("Address", form.address)}
                ${renderField("Email", form.email)}
                ${renderField("Type of Function", form.typeOfFunction)}
                ${renderField("Number of guests", form.guestCount)}
                ${renderField("Rental Fee Check #", form.rentalFeeCheck)}
                ${renderField("Deposit Check #", form.depositCheck)}
              </div>
            </div>
          </div>
          ${sectionsHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
          <div className="min-w-[240px]">
            <p className="text-xs uppercase tracking-[0.25em] text-leaf-700">Silverleaf Reserve HOA</p>
            <h3 className="text-lg font-semibold text-slate-900">Clubhouse Form</h3>
          </div>
          <div className="min-w-[300px] flex-1">
            <input
              type="text"
              placeholder="Search clubhouse form..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none ring-leaf-600 placeholder:text-slate-400 focus:ring-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/hoa/ClubhouseForm.pdf"
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
              {CLUBHOUSE_FORM_SECTIONS.map((section, index) => (
                <button
                  type="button"
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-white hover:text-leaf-800"
                >
                  <span className="inline-flex min-w-10 justify-center rounded-md bg-white px-2 py-1 text-[11px] font-semibold tracking-wide text-leaf-700 shadow-sm">
                    {index + 1}
                  </span>
                  <span>{section.title}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="overflow-y-auto bg-white p-5">
            <section className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h4 className="text-xl font-semibold text-slate-900">Clubhouse Reservation Application and Agreement</h4>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                {renderHighlightedText(CLUBHOUSE_FORM_INTRO, query)}
              </p>
            </section>

            <div className="space-y-4">
              {filteredSections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-4">
                  <FormSectionCard section={section} query={query} form={form} updateField={updateField} />
                </section>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-lg bg-leaf-600 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-700"
              >
                Print form
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
