package com.hoa.silverleaf.users.dto;

import com.hoa.silverleaf.users.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateResidentRequest(
        @NotBlank @Size(max = 120) String fullName,
        @Email @NotBlank String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        UserRole role
) {
}
