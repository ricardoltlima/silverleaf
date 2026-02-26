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
        long memberCount
) {
}
