package com.hoa.silverleaf.messages;

import com.hoa.silverleaf.messages.dto.CreateDirectMessageRequest;
import com.hoa.silverleaf.messages.dto.DirectConversationResponse;
import com.hoa.silverleaf.messages.dto.DirectMessageResponse;
import com.hoa.silverleaf.messages.dto.UnreadCountResponse;
import com.hoa.silverleaf.security.AppUserPrincipal;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount(@AuthenticationPrincipal AppUserPrincipal principal) {
        return messageService.unreadCount(principal);
    }

    @GetMapping("/conversations")
    public List<DirectConversationResponse> conversations(@AuthenticationPrincipal AppUserPrincipal principal) {
        return messageService.conversations(principal);
    }

    @GetMapping("/thread/{otherUserId}")
    public List<DirectMessageResponse> thread(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long otherUserId
    ) {
        return messageService.thread(principal, otherUserId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DirectMessageResponse send(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @Valid @RequestBody CreateDirectMessageRequest request
    ) {
        return messageService.send(principal, request);
    }

    @PostMapping("/thread/{otherUserId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markThreadAsRead(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long otherUserId
    ) {
        messageService.markThreadAsRead(principal, otherUserId);
    }
}
