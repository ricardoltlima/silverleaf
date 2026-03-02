package com.hoa.silverleaf.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateViolationRequest(
        @NotBlank String description,
        @Size(max = 500) String photoUrl,
        List<@Size(max = 500) String> mediaUrls
) {
}
