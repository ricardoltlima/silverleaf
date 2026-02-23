package com.hoa.silverleaf.feed.dto;

import java.time.Instant;
import java.util.List;

public record FeedPostResponse(
        Long id,
        Long authorUserId,
        String authorName,
        String text,
        Instant createdAt,
        List<FeedPostMediaResponse> media,
        long likesCount,
        long commentsCount,
        List<FeedCommentResponse> comments
) {
}
