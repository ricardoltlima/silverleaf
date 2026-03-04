package com.hoa.silverleaf.feed.dto;

import java.time.Instant;
import java.util.List;

public record FeedPostReportResponse(
        Long postId,
        String channel,
        String groupSlug,
        Long authorUserId,
        String authorName,
        String authorPhotoUrl,
        String bodyText,
        Instant postCreatedAt,
        List<FeedPostMediaResponse> media,
        long reportCount,
        List<String> reporterNames,
        Instant latestReportedAt
) {
}
