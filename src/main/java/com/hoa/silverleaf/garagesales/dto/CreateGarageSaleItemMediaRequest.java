package com.hoa.silverleaf.garagesales.dto;

import com.hoa.silverleaf.garagesales.GarageSaleMediaType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateGarageSaleItemMediaRequest(
        @NotNull GarageSaleMediaType type,
        @NotBlank @Size(max = 500) String url
) {
}
