package com.hoa.silverleaf.feed.dto;

import com.hoa.silverleaf.feed.FeedMediaType;

public record FeedPostMediaResponse(
        FeedMediaType type,
        String url
) {
}
