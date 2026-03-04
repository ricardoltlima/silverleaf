package com.hoa.silverleaf.users.dto;

public record CommunityMembershipResponse(
        Long communityId,
        String communitySlug,
        String communityName,
        boolean active,
        boolean communityAdmin
) {
}
