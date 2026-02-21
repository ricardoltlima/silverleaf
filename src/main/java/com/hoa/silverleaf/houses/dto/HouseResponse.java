package com.hoa.silverleaf.houses.dto;

import com.hoa.silverleaf.houses.HouseStatus;

import java.time.Instant;
import java.util.List;

public record HouseResponse(
        Long id,
        String address,
        String qrToken,
        HouseStatus status,
        Instant claimedAt,
        List<HouseResidentResponse> residents
) {
}
