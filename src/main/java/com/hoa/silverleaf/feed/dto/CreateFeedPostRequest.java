package com.hoa.silverleaf.feed.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateFeedPostRequest(
        @Size(max = 4000) String text,
        @Valid List<CreateFeedPostMediaRequest> media
) {
}
