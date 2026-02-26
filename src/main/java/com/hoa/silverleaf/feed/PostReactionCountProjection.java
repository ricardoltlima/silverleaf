package com.hoa.silverleaf.feed;

public interface PostReactionCountProjection {
    Long getPostId();
    FeedReactionType getReactionType();
    Long getTotalCount();
}
