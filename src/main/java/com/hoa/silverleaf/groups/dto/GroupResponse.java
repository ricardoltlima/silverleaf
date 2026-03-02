package com.hoa.silverleaf.groups.dto;

public record GroupResponse(
        Long id,
        String slug,
        String name,
        String description,
        String visibility,
        Long ownerUserId,
        String ownerName,
        boolean subscribed,
        boolean requestPending,
        String requestStatus,
        boolean owner,
        long pendingRequestCount,
        long memberCount
) {
}
