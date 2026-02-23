package com.hoa.silverleaf.feed.dto;

public record FeedLikeResponse(
        Long postId,
        boolean liked,
        long likesCount
) {
}
