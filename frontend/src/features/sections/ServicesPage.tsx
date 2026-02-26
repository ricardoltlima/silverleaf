import { FeedPage } from "@/features/feed/FeedPage";

export function ServicesPage() {
  return (
    <FeedPage
      channel="SERVICES"
      composerPlaceholder="Share your services with your neighbors..."
    />
  );
}
