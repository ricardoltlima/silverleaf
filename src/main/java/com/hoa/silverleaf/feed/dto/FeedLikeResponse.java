package com.hoa.silverleaf.feed.dto;

import java.util.Map;

public record FeedLikeResponse(
        Long postId,
        String viewerReaction,
        long likesCount,
        Map<String, Long> reactionCounts
) {
}
