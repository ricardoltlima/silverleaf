package com.hoa.silverleaf.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateViolationStatusRequest(
        @NotBlank @Size(max = 30) String status
) {
}
