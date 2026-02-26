package com.hoa.silverleaf.houses.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record LocalOnboardingRegisterRequest(
        @NotNull Long houseId,
        @NotBlank @Size(max = 120) String fullName,
        @Email @NotBlank String email
) {
}
