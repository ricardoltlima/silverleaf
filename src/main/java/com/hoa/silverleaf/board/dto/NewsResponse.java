package com.hoa.silverleaf.board.dto;

import java.time.Instant;
import java.util.List;

public record NewsResponse(
        Long id,
        String title,
        String body,
        List<String> mediaUrls,
        String authorName,
        Instant createdAt,
        Instant updatedAt
) {
}
