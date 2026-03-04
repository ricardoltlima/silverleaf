package com.hoa.silverleaf.auth.dto;

import java.time.Instant;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        Instant accessTokenExpiresAt,
        Long activeCommunityId,
        String activeCommunitySlug,
        String activeCommunityName
) {
}
