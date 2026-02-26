package com.hoa.silverleaf.messages.dto;

import java.time.Instant;

public record DirectConversationResponse(
        Long otherUserId,
        String otherUserName,
        String otherUserPhotoUrl,
        String lastMessage,
        Instant lastMessageAt,
        long unreadCount
) {
}
