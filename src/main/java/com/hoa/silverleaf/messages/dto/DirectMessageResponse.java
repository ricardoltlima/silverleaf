package com.hoa.silverleaf.messages.dto;

import java.time.Instant;

public record DirectMessageResponse(
        Long id,
        Long senderUserId,
        String senderName,
        String senderPhotoUrl,
        Long recipientUserId,
        String recipientName,
        String recipientPhotoUrl,
        String body,
        Instant createdAt,
        Instant readAt
) {
}
