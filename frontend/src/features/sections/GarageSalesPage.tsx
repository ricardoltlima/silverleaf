import { SectionFeedPage } from "@/features/sections/SectionFeedPage";

const items = [
  {
    id: "gs-1",
    title: "Saturday Garage Sale - 18 Palm Court",
    summary: "Furniture, toys, and home decor from 8:00 AM to 12:00 PM.",
    meta: "This Saturday"
  },
  {
    id: "gs-2",
    title: "Neighborhood Multi-Family Sale",
    summary: "Three families joining at Silverleaf Lane. Early access at 7:30 AM.",
    meta: "Next week"
  }
];

export function GarageSalesPage() {
  return (
    <SectionFeedPage
      heading="Garage Sales"
      description="Upcoming and active garage sale posts from residents."
      accentClass="bg-amber-100 text-amber-800"
      items={items}
    />
  );
}
