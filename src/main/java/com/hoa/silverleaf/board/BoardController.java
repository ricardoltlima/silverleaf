package com.hoa.silverleaf.board;

import com.hoa.silverleaf.board.dto.BroadcastResponse;
import com.hoa.silverleaf.board.dto.CreateBroadcastRequest;
import com.hoa.silverleaf.board.dto.CreateNewsRequest;
import com.hoa.silverleaf.board.dto.CreatePollRequest;
import com.hoa.silverleaf.board.dto.CreateViolationRequest;
import com.hoa.silverleaf.board.dto.NewsResponse;
import com.hoa.silverleaf.board.dto.PollResponse;
import com.hoa.silverleaf.board.dto.UpdateNewsRequest;
import com.hoa.silverleaf.board.dto.UpdateViolationStatusRequest;
import com.hoa.silverleaf.board.dto.ViolationResponse;
import com.hoa.silverleaf.board.dto.VotePollRequest;
import com.hoa.silverleaf.security.AppUserPrincipal;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1")
public class BoardController {

    private final BoardService boardService;

    public BoardController(BoardService boardService) {
        this.boardService = boardService;
    }

    @GetMapping("/news")
    public List<NewsResponse> listNews() {
        return boardService.listNews();
    }

    @PostMapping("/board/news")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public NewsResponse createNews(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @Valid @RequestBody CreateNewsRequest request
    ) {
        log.info("Board news create requested by userId={}", principal.getId());
        return boardService.createNews(principal, request);
    }

    @PutMapping("/board/news/{newsId}")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    public NewsResponse updateNews(
            @PathVariable Long newsId,
            @Valid @RequestBody UpdateNewsRequest request
    ) {
        log.info("Board news update requested newsId={}", newsId);
        return boardService.updateNews(newsId, request);
    }

    @DeleteMapping("/board/news/{newsId}")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNews(@PathVariable Long newsId) {
        log.info("Board news delete requested newsId={}", newsId);
        boardService.deleteNews(newsId);
    }

    @GetMapping("/broadcasts")
    public List<BroadcastResponse> listBroadcasts() {
        return boardService.listBroadcasts();
    }

    @PostMapping("/board/broadcasts")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public BroadcastResponse createBroadcast(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @Valid @RequestBody CreateBroadcastRequest request
    ) {
        log.info("Board broadcast create requested by userId={}", principal.getId());
        return boardService.createBroadcast(principal, request);
    }

    @GetMapping("/polls")
    public List<PollResponse> listPolls(@AuthenticationPrincipal AppUserPrincipal principal) {
        return boardService.listActivePolls(principal);
    }

    @PostMapping("/board/polls")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public PollResponse createPoll(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @Valid @RequestBody CreatePollRequest request
    ) {
        log.info("Board poll create requested by userId={}", principal.getId());
        return boardService.createPoll(principal, request);
    }

    @PostMapping("/polls/{pollId}/vote")
    public PollResponse votePoll(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long pollId,
            @Valid @RequestBody VotePollRequest request
    ) {
        log.info("Poll vote requested by userId={} pollId={}", principal.getId(), pollId);
        return boardService.vote(principal, pollId, request);
    }

    @PostMapping("/violations")
    @ResponseStatus(HttpStatus.CREATED)
    public ViolationResponse createViolation(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @Valid @RequestBody CreateViolationRequest request
    ) {
        log.info("Violation report create requested by userId={}", principal.getId());
        return boardService.createViolation(principal, request);
    }

    @GetMapping("/violations/mine")
    public List<ViolationResponse> listMyViolations(@AuthenticationPrincipal AppUserPrincipal principal) {
        return boardService.listMyViolations(principal);
    }

    @GetMapping("/board/violations")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    public List<ViolationResponse> listAllViolations() {
        return boardService.listAllViolations();
    }

    @PatchMapping("/board/violations/{violationId}/status")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    public ViolationResponse updateViolationStatus(
            @PathVariable Long violationId,
            @Valid @RequestBody UpdateViolationStatusRequest request
    ) {
        log.info("Violation status update requested violationId={} status={}", violationId, request.status());
        return boardService.updateViolationStatus(violationId, request);
    }
}
