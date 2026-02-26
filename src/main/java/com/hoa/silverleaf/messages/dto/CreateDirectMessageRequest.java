package com.hoa.silverleaf.messages.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateDirectMessageRequest(
        @NotNull Long recipientUserId,
        @NotBlank @Size(max = 4000) String body
) {
}
