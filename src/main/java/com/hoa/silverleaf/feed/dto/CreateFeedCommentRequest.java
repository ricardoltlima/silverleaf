package com.hoa.silverleaf.feed.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateFeedCommentRequest(
        @NotBlank @Size(max = 1000) String text
) {
}
