package com.hoa.silverleaf.feed.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record FeedLikeResponse(
        Long postId,
        String viewerReaction,
        long likesCount,
        Map<String, Long> reactionCounts
) {
}
