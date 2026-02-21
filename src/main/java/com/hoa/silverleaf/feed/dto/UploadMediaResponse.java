package com.hoa.silverleaf.feed.dto;

import com.hoa.silverleaf.feed.FeedMediaType;

public record UploadMediaResponse(
        FeedMediaType type,
        String url
) {
}
