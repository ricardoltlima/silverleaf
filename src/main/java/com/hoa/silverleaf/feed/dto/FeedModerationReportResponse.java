package com.hoa.silverleaf.feed.dto;

import java.time.Instant;
import java.util.List;

public record FeedModerationReportResponse(
        String targetType,
        Long postId,
        Long commentId,
        String channel,
        String groupSlug,
        Long authorUserId,
        String authorName,
        String authorPhotoUrl,
        String bodyText,
        Instant createdAt,
        List<FeedPostMediaResponse> media,
        long reportCount,
        List<String> reporterNames,
        Instant latestReportedAt
) {
}
