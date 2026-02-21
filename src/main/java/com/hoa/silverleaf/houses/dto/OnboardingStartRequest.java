package com.hoa.silverleaf.houses.dto;

import jakarta.validation.constraints.NotNull;

public record OnboardingStartRequest(
        @NotNull Long houseId
) {
}
