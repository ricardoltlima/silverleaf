package com.hoa.silverleaf.board.dto;

import java.time.Instant;

public record BroadcastResponse(
        Long id,
        String title,
        String body,
        String authorName,
        Instant createdAt
) {
}
