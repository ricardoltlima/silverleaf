package com.hoa.silverleaf.feed.dto;

public record FeedReplyCreatedEvent(
        Long postId,
        FeedCommentResponse comment
) {
}
