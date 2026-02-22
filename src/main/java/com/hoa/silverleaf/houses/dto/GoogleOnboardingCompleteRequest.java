package com.hoa.silverleaf.houses.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoogleOnboardingCompleteRequest(
        @NotBlank @Size(max = 64) String sessionToken,
        @NotBlank String idToken
) {
}
