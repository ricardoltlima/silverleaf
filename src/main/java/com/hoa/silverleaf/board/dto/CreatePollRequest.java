package com.hoa.silverleaf.board.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreatePollRequest(
        @NotBlank @Size(max = 300) String question,
        List<@NotBlank @Size(max = 120) String> options
) {
}
