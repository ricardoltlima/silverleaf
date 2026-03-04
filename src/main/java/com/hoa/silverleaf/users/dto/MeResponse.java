package com.hoa.silverleaf.users.dto;

import com.hoa.silverleaf.users.UserRole;

public record MeResponse(
        Long id,
        String email,
        String fullName,
        UserRole role,
        String photoUrl,
        Long activeCommunityId,
        String activeCommunitySlug,
        String activeCommunityName,
        boolean communityAdmin
) {
}
