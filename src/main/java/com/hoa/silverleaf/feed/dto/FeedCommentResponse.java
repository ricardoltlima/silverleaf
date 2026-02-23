package com.hoa.silverleaf.feed.dto;

import java.time.Instant;

public record FeedCommentResponse(
        Long id,
        Long authorUserId,
        String authorName,
        String text,
        Instant createdAt
) {
}
