package com.hoa.silverleaf.houses.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OnboardingCompleteRequest(
        @NotBlank @Size(max = 64) String sessionToken,
        @NotBlank @Size(max = 30) String provider,
        @NotBlank @Size(max = 255) String providerSubject,
        @NotBlank @Size(max = 120) String fullName,
        @Email @NotBlank String email
) {
}
