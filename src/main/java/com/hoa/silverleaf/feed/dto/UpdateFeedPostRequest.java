package com.hoa.silverleaf.feed.dto;

import jakarta.validation.constraints.Size;

public record UpdateFeedPostRequest(
        @Size(max = 4000, message = "text must be at most 4000 characters")
        String text
) {
}
