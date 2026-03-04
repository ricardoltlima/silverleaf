package com.hoa.silverleaf.alerts;

import com.hoa.silverleaf.alerts.dto.FeedReactionAlertResponse;
import com.hoa.silverleaf.security.AppUserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts/reactions")
public class FeedReactionAlertController {

    private final FeedReactionAlertService feedReactionAlertService;

    public FeedReactionAlertController(FeedReactionAlertService feedReactionAlertService) {
        this.feedReactionAlertService = feedReactionAlertService;
    }

    @GetMapping
    public List<FeedReactionAlertResponse> list(@AuthenticationPrincipal AppUserPrincipal principal) {
        return feedReactionAlertService.listForCurrentUser(principal);
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@AuthenticationPrincipal AppUserPrincipal principal) {
        feedReactionAlertService.markAllRead(principal);
    }
}
