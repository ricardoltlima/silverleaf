package com.hoa.silverleaf.feed.dto;

import java.util.List;

public record FeedPageResponse(
        List<FeedPostResponse> items,
        String nextCursor
) {
}
