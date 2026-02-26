package com.hoa.silverleaf.feed;

public interface CommentReactionCountProjection {
    Long getCommentId();
    FeedReactionType getReactionType();
    Long getTotalCount();
}
