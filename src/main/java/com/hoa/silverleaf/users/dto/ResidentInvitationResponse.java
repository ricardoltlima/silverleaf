package com.hoa.silverleaf.users.dto;

import com.hoa.silverleaf.users.UserRole;
import java.time.Instant;

public record ResidentInvitationResponse(
        Long residentId,
        String fullName,
        String email,
        UserRole role,
        Long houseId,
        String houseAddress,
        String invitationToken,
        String invitationUrl,
        Instant expiresAt
) {
}
