package com.hoa.silverleaf.board.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record VotePollRequest(
        @NotNull @Min(0) Integer optionIndex
) {
}
