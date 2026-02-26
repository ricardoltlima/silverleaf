import { SectionFeedPage } from "@/features/sections/SectionFeedPage";

const items = [
  {
    id: "rs-1",
    title: "Clubhouse Reservation",
    summary: "Reserve the clubhouse for private events. Approval required 48h in advance.",
    meta: "Available"
  },
  {
    id: "rs-2",
    title: "Tennis Court Slots",
    summary: "Book evening slots in 60-minute blocks with member ID.",
    meta: "Open"
  },
  {
    id: "rs-3",
    title: "BBQ Pavilion",
    summary: "Weekend reservations open for the next four weeks.",
    meta: "Popular"
  }
];

export function ReservationsPage() {
  return (
    <SectionFeedPage
      heading="Reservations"
      description="Reservation-related posts and availability updates."
      accentClass="bg-blue-100 text-blue-800"
      items={items}
    />
  );
}
