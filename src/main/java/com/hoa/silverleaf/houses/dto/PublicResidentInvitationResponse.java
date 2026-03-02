package com.hoa.silverleaf.houses.dto;

public record PublicResidentInvitationResponse(
        String invitationToken,
        Long houseId,
        String houseAddress,
        String fullName,
        String email,
        boolean expired
) {
}
