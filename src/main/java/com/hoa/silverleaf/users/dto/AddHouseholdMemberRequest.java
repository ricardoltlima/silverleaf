package com.hoa.silverleaf.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddHouseholdMemberRequest(
        @NotBlank @Size(max = 120) String fullName,
        @Email @NotBlank String email
) {
}
