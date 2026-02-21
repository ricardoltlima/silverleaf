package com.hoa.silverleaf.users.dto;

import com.hoa.silverleaf.users.UserRole;

public record ResidentResponse(
        Long id,
        String email,
        String fullName,
        UserRole role,
        boolean enabled
) {
}
