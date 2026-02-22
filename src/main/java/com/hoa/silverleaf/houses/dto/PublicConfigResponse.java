package com.hoa.silverleaf.houses.dto;

public record PublicConfigResponse(
        String googleClientId,
        boolean localLoginEnabled
) {
}
