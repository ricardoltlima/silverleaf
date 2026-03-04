package com.hoa.silverleaf.feed.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record FeedCommentReactionResponse(
        Long commentId,
        String viewerReaction,
        long likesCount,
        Map<String, Long> reactionCounts
) {
}
