package com.hoa.silverleaf.feed;

import com.hoa.silverleaf.feed.dto.CreateFeedPostRequest;
import com.hoa.silverleaf.feed.dto.CreateFeedCommentRequest;
import com.hoa.silverleaf.feed.dto.FeedCommentResponse;
import com.hoa.silverleaf.feed.dto.FeedCommentReactionResponse;
import com.hoa.silverleaf.feed.dto.FeedLikeResponse;
import com.hoa.silverleaf.feed.dto.FeedPageResponse;
import com.hoa.silverleaf.feed.dto.FeedPostResponse;
import com.hoa.silverleaf.feed.dto.UploadMediaResponse;
import com.hoa.silverleaf.security.AppUserPrincipal;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/v1/feed")
public class FeedController {

    private final FeedService feedService;
    private final FeedUploadService feedUploadService;

    public FeedController(FeedService feedService, FeedUploadService feedUploadService) {
        this.feedService = feedService;
        this.feedUploadService = feedUploadService;
    }

    @GetMapping
    public FeedPageResponse feed(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "COMMUNITY") FeedChannel channel
    ) {
        log.debug("Feed read requested cursor={} limit={} channel={}", cursor, limit, channel);
        return feedService.getFeed(principal, cursor, limit, channel);
    }

    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public FeedPostResponse createPost(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @Valid @RequestBody CreateFeedPostRequest request
    ) {
        log.info("Feed post create requested by userId={} channel={}", principal.getId(),
                request.channel() == null ? FeedChannel.COMMUNITY : request.channel());
        return feedService.createPost(principal, request);
    }

    @PostMapping("/uploads")
    public UploadMediaResponse uploadMedia(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @RequestParam(defaultValue = "false") boolean attachment,
            @RequestPart("file") MultipartFile file
    ) {
        log.info("Feed media upload requested by userId={} attachment={} contentType={} size={}",
                principal.getId(), attachment, file.getContentType(), file.getSize());
        return feedUploadService.upload(file, attachment);
    }

    @PostMapping("/posts/{postId}/likes")
    public FeedLikeResponse likePost(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long postId,
            @RequestParam(defaultValue = "HEART") FeedReactionType reaction
    ) {
        log.info("Feed reaction requested postId={} userId={} reaction={}", postId, principal.getId(), reaction);
        return feedService.likePost(postId, principal, reaction);
    }

    @DeleteMapping("/posts/{postId}/likes")
    public FeedLikeResponse unlikePost(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long postId
    ) {
        log.info("Feed unlike requested postId={} userId={}", postId, principal.getId());
        return feedService.unlikePost(postId, principal);
    }

    @PostMapping("/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public FeedCommentResponse addComment(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long postId,
            @Valid @RequestBody CreateFeedCommentRequest request
    ) {
        log.info("Feed comment create requested postId={} userId={}", postId, principal.getId());
        return feedService.addComment(postId, principal, request);
    }

    @PostMapping("/posts/{postId}/comments/{commentId}/likes")
    public FeedCommentReactionResponse reactToComment(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @RequestParam(defaultValue = "HEART") FeedReactionType reaction
    ) {
        log.info("Feed comment reaction requested postId={} commentId={} userId={} reaction={}",
                postId, commentId, principal.getId(), reaction);
        return feedService.reactToComment(commentId, principal, reaction);
    }

    @DeleteMapping("/posts/{postId}/comments/{commentId}/likes")
    public FeedCommentReactionResponse clearCommentReaction(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long postId,
            @PathVariable Long commentId
    ) {
        log.info("Feed comment reaction clear requested postId={} commentId={} userId={}",
                postId, commentId, principal.getId());
        return feedService.clearCommentReaction(commentId, principal);
    }

    @DeleteMapping("/posts/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long postId
    ) {
        log.info("Feed post delete requested postId={} userId={}", postId, principal.getId());
        feedService.deleteOwnPost(postId, principal);
    }
}
