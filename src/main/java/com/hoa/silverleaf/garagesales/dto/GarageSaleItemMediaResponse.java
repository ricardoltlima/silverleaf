package com.hoa.silverleaf.garagesales.dto;

import com.hoa.silverleaf.garagesales.GarageSaleMediaType;

public record GarageSaleItemMediaResponse(
        GarageSaleMediaType type,
        String url
) {
}
