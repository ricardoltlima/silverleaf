package com.hoa.silverleaf.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SwitchCommunityRequest(
        @NotNull Long communityId,
        @NotBlank String refreshToken
) {
}
