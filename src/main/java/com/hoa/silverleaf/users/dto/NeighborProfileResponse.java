package com.hoa.silverleaf.users.dto;

public record NeighborProfileResponse(
        Long id,
        String fullName,
        String email,
        String photoUrl,
        String address,
        boolean serviceEnabled,
        String serviceTitle,
        String serviceDescription,
        String serviceContactPhone,
        String serviceContactEmail,
        String serviceBusinessUrl,
        String serviceHours,
        String serviceArea,
        String serviceVisibility
) {
}
