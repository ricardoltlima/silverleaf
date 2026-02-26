package com.hoa.silverleaf.garagesales.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateGarageSaleItemRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank @Size(max = 60) String price,
        @NotBlank @Size(max = 80) String condition,
        @NotBlank @Size(max = 80) String category,
        String description,
        @Valid List<CreateGarageSaleItemMediaRequest> media
) {
}
