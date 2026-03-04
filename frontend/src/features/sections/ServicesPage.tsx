import { useSearchParams } from "react-router-dom";
import { FeedPage } from "@/features/feed/FeedPage";

export function ServicesPage() {
  const [searchParams] = useSearchParams();
  const focusedPostId = Number(searchParams.get("postId"));
  const focusedCommentId = Number(searchParams.get("commentId"));

  return (
    <FeedPage
      channel="SERVICES"
      composerPlaceholder="Share your services with your neighbors..."
      focusedPostId={Number.isFinite(focusedPostId) ? focusedPostId : null}
      focusedCommentId={Number.isFinite(focusedCommentId) ? focusedCommentId : null}
    />
  );
}
