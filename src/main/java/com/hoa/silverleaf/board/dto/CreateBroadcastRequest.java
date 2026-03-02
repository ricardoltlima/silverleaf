package com.hoa.silverleaf.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBroadcastRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank String body
) {
}
