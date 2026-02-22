package com.hoa.silverleaf.houses.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LocalOnboardingLoginRequest(
        @NotNull Long houseId,
        @Email @NotBlank String email,
        @NotBlank String password
) {
}
