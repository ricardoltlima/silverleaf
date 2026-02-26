import type { FeedPost } from "@/features/feed/types";
import { getLastSeen } from "@/features/groups/groupsStorage";

export type GroupAlertItem = FeedPost & {
  groupName: string;
  unread: boolean;
};

export function getUnreadGroupPosts(posts: FeedPost[]) {
  return getGroupAlerts(posts).filter((post) => post.unread);
}

export function getGroupAlerts(posts: FeedPost[]): GroupAlertItem[] {
  const lastSeen = getLastSeen();

  return posts
    .filter((post) => {
      if (post.channel !== "GROUP" || !post.groupSlug) return false;
      return true;
    })
    .map((post) => {
      const seenAt = lastSeen[post.groupSlug || ""];
      const unread = !seenAt || new Date(post.createdAt).getTime() > new Date(seenAt).getTime();
      return {
        ...post,
        unread,
        groupName: post.groupSlug || "Group"
      };
    });
}
