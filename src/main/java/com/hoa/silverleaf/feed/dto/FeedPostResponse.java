package com.hoa.silverleaf.feed.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record FeedPostResponse(
        Long id,
        String channel,
        Long authorUserId,
        String authorName,
        String authorPhotoUrl,
        String text,
        Instant createdAt,
        List<FeedPostMediaResponse> media,
        long likesCount,
        Map<String, Long> reactionCounts,
        String viewerReaction,
        long commentsCount,
        List<FeedCommentResponse> comments
) {
}
