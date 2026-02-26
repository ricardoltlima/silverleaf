package com.hoa.silverleaf.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateMyProfileRequest(
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Email @Size(max = 320) String email,
        @Size(max = 40) String phoneNumber,
        @Size(min = 8, max = 120) String password,
        boolean serviceEnabled,
        @Size(max = 140) String serviceTitle,
        String serviceDescription,
        @Size(max = 40) String serviceContactPhone,
        @Email @Size(max = 320) String serviceContactEmail,
        @Size(max = 500) String serviceBusinessUrl,
        @Size(max = 160) String serviceHours,
        @Size(max = 160) String serviceArea,
        @Size(max = 30) String serviceVisibility
) {
}
