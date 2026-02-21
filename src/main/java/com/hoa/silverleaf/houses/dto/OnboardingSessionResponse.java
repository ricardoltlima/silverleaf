package com.hoa.silverleaf.houses.dto;

import com.hoa.silverleaf.houses.onboarding.OnboardingStatus;

import java.time.Instant;

public record OnboardingSessionResponse(
        String sessionToken,
        Long houseId,
        String houseAddress,
        OnboardingStatus status,
        boolean contactVerified,
        String verificationToken,
        Instant verificationExpiresAt
) {
}
