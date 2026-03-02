package com.hoa.silverleaf.groups.dto;

import java.time.Instant;

public record GroupJoinRequestResponse(
        Long requestId,
        Long groupId,
        String groupName,
        Long requesterUserId,
        String requesterName,
        String requesterEmail,
        Instant createdAt
) {
}

