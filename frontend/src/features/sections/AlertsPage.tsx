import { SectionFeedPage } from "@/features/sections/SectionFeedPage";

const items = [
  {
    id: "al-1",
    title: "Gate Access System Maintenance",
    summary: "Main gate will run in manual mode from 10:00 PM to 11:30 PM.",
    meta: "High priority"
  },
  {
    id: "al-2",
    title: "Storm Watch",
    summary: "Please secure outdoor furniture and review emergency contacts.",
    meta: "Weather"
  },
  {
    id: "al-3",
    title: "Water Shutdown Notice",
    summary: "Planned utility work may affect pressure in Section B.",
    meta: "Tomorrow"
  }
];

export function AlertsPage() {
  return (
    <SectionFeedPage
      heading="Alerts"
      description="Important notices from HOA and property management."
      accentClass="bg-rose-100 text-rose-800"
      items={items}
    />
  );
}
