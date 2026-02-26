package com.hoa.silverleaf.feed.dto;

import java.util.Map;

public record FeedCommentReactionResponse(
        Long commentId,
        String viewerReaction,
        long likesCount,
        Map<String, Long> reactionCounts
) {
}
