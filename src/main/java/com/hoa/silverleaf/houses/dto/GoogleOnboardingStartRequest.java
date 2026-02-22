package com.hoa.silverleaf.houses.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GoogleOnboardingStartRequest(
        @NotNull Long houseId,
        @NotBlank String idToken
) {
}
