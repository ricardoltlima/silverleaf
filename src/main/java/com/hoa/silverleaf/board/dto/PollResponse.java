package com.hoa.silverleaf.board.dto;

import java.time.Instant;
import java.util.List;

public record PollResponse(
        Long id,
        String question,
        List<String> options,
        List<Long> voteCounts,
        Integer viewerVoteIndex,
        boolean active,
        Instant createdAt
) {
}
