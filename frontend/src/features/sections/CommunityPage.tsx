import { useSearchParams } from "react-router-dom";
import { FeedPage } from "@/features/feed/FeedPage";

export function CommunityPage() {
  const [searchParams] = useSearchParams();
  const focusedPostId = Number(searchParams.get("postId"));
  const focusedCommentId = Number(searchParams.get("commentId"));

  return (
    <FeedPage
      focusedPostId={Number.isFinite(focusedPostId) ? focusedPostId : null}
      focusedCommentId={Number.isFinite(focusedCommentId) ? focusedCommentId : null}
    />
  );
}
