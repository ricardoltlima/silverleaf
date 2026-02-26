package com.hoa.silverleaf.feed.dto;

public record FeedAuthorServiceResponse(
        String title,
        String description,
        String contactPhone,
        String contactEmail,
        String businessUrl,
        String hours,
        String serviceArea,
        String visibility
) {
}
