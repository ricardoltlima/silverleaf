package com.hoa.silverleaf.users.dto;

public record NeighborListItemResponse(
        Long id,
        String fullName,
        String photoUrl,
        String address,
        boolean serviceEnabled,
        String serviceTitle
) {
}
