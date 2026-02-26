package com.hoa.silverleaf.feed.dto;

import java.time.Instant;
import java.util.Map;

public record FeedCommentResponse(
        Long id,
        Long authorUserId,
        String authorName,
        String authorPhotoUrl,
        String text,
        Instant createdAt,
        long likesCount,
        Map<String, Long> reactionCounts,
        String viewerReaction
) {
}
