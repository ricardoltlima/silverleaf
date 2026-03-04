export type FeedReactionType = "HEART" | "CLAP" | "OK";

export type FeedMediaType = "IMAGE" | "VIDEO" | "FILE";

export type FeedMedia = {
  type: FeedMediaType;
  url: string;
};

export type FeedComment = {
  id: number;
  postId?: number;
  authorUserId: number;
  authorName: string;
  authorPhotoUrl?: string | null;
  text: string;
  createdAt: string;
  likesCount: number;
  reactionCounts: Record<FeedReactionType, number>;
  viewerReaction: FeedReactionType | null;
};

export type FeedPost = {
  id: number;
  channel?: "COMMUNITY" | "SERVICES" | "GROUP";
  groupSlug?: string | null;
  authorUserId: number;
  authorName: string;
  authorPhotoUrl?: string | null;
  authorService?: {
    title: string | null;
    description: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    businessUrl: string | null;
    hours: string | null;
  } | null;
  text: string | null;
  createdAt: string;
  media: FeedMedia[];
  likesCount: number;
  reactionCounts: Record<FeedReactionType, number>;
  viewerReaction: FeedReactionType | null;
  commentsCount: number;
  comments: FeedComment[];
};

export type FeedPageResponse = {
  items: FeedPost[];
  nextCursor: string | null;
};

export type FeedLikeResponse = {
  postId: number;
  viewerReaction: FeedReactionType | null;
  likesCount: number;
  reactionCounts: Record<FeedReactionType, number>;
};

export type FeedCommentReactionResponse = {
  commentId: number;
  viewerReaction: FeedReactionType | null;
  likesCount: number;
  reactionCounts: Record<FeedReactionType, number>;
};
