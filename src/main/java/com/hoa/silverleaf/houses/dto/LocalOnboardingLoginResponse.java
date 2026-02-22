package com.hoa.silverleaf.houses.dto;

import com.hoa.silverleaf.auth.dto.AuthResponse;

public record LocalOnboardingLoginResponse(
        AuthResponse auth,
        HouseResponse house
) {
}
