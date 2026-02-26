package com.hoa.silverleaf.garagesales.dto;

import java.time.Instant;
import java.util.List;

public record GarageSaleItemResponse(
        Long id,
        Long sellerUserId,
        String title,
        String price,
        String condition,
        String category,
        String description,
        String sellerName,
        String sellerEmail,
        String sellerPhone,
        String sellerPhotoUrl,
        Instant createdAt,
        List<GarageSaleItemMediaResponse> media
) {
}
