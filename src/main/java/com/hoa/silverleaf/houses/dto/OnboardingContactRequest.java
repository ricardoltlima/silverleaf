package com.hoa.silverleaf.houses.dto;

import com.hoa.silverleaf.houses.onboarding.ContactType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OnboardingContactRequest(
        @NotBlank @Size(max = 64) String sessionToken,
        @NotNull ContactType contactType,
        @NotBlank @Size(max = 320) String contactValue
) {
}
