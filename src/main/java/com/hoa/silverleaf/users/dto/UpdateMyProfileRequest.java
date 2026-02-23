package com.hoa.silverleaf.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateMyProfileRequest(
        @NotBlank @Size(max = 120) String fullName,
        @Size(min = 8, max = 120) String password
) {
}
