package com.hoa.silverleaf.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateNewsRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank String body,
        List<@NotBlank @Size(max = 500) String> mediaUrls
) {
}
