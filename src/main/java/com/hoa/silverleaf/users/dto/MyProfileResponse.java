package com.hoa.silverleaf.users.dto;

public record MyProfileResponse(
        Long id,
        String email,
        String fullName,
        String photoUrl,
        String phoneNumber,
        String address,
        boolean addressVisible,
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
