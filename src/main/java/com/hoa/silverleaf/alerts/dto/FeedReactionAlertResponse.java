package com.hoa.silverleaf.alerts.dto;

public record FeedReactionAlertResponse(
        Long id,
        Long postId,
        String channel,
        String groupSlug,
        Long actorUserId,
        String actorName,
        String actorPhotoUrl,
        String reactionType,
        String postPreview,
        String createdAt,
        boolean unread
) {
}
