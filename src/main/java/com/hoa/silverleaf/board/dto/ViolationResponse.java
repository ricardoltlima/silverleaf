package com.hoa.silverleaf.board.dto;

import java.time.Instant;
import java.util.List;

public record ViolationResponse(
        Long id,
        String description,
        String photoUrl,
        List<String> mediaUrls,
        String status,
        Long reporterUserId,
        String reporterName,
        Instant createdAt
) {
}
