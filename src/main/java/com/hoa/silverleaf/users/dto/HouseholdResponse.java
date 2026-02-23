package com.hoa.silverleaf.users.dto;

import com.hoa.silverleaf.houses.HouseStatus;
import com.hoa.silverleaf.houses.dto.HouseResidentResponse;

import java.util.List;

public record HouseholdResponse(
        Long houseId,
        String houseAddress,
        HouseStatus houseStatus,
        List<HouseResidentResponse> residents
) {
}
