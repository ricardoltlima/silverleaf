package com.hoa.silverleaf.houses.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateHouseRequest(
        @NotBlank @Size(max = 255) String address
) {
}
