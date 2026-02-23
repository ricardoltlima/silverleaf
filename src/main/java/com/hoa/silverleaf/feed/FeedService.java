package com.hoa.silverleaf.feed;

import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.feed.dto.CreateFeedPostMediaRequest;
import com.hoa.silverleaf.feed.dto.CreateFeedCommentRequest;
import com.hoa.silverleaf.feed.dto.FeedCommentResponse;
import com.hoa.silverleaf.feed.dto.FeedLikeResponse;
import com.hoa.silverleaf.feed.dto.CreateFeedPostRequest;
import com.hoa.silverleaf.feed.dto.FeedPageResponse;
import com.hoa.silverleaf.feed.dto.FeedPostMediaResponse;
import com.hoa.silverleaf.feed.dto.FeedPostResponse;
import com.hoa.silverleaf.security.AppUserPrincipal;
import com.hoa.silverleaf.users.UserEntity;
import com.hoa.silverleaf.users.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class FeedService {

    private final FeedPostRepository feedPostRepository;
    private final FeedPostMediaRepository feedPostMediaRepository;
    private final FeedPostLikeRepository feedPostLikeRepository;
    private final FeedPostCommentRepository feedPostCommentRepository;
    private final UserRepository userRepository;

    public FeedService(
            FeedPostRepository feedPostRepository,
            FeedPostMediaRepository feedPostMediaRepository,
            FeedPostLikeRepository feedPostLikeRepository,
            FeedPostCommentRepository feedPostCommentRepository,
            UserRepository userRepository
    ) {
        this.feedPostRepository = feedPostRepository;
        this.feedPostMediaRepository = feedPostMediaRepository;
        this.feedPostLikeRepository = feedPostLikeRepository;
        this.feedPostCommentRepository = feedPostCommentRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public FeedPageResponse getFeed(String cursor, int limit) {
        // Cursor-based pagination keeps reads stable for infinite-scroll clients.
        int pageSize = Math.max(1, Math.min(limit, 50));
        CursorParts cursorParts = parseCursor(cursor);
        log.debug("Loading feed page pageSize={} cursorCreatedAt={} cursorPostId={}",
                pageSize, cursorParts.createdAt(), cursorParts.id());
        List<FeedPostEntity> posts;
        if (cursorParts.createdAt() == null || cursorParts.id() == null) {
            posts = feedPostRepository.findAllByOrderByCreatedAtDescIdDesc(PageRequest.of(0, pageSize));
        } else {
            posts = feedPostRepository.findFeedAfterCursor(
                    cursorParts.createdAt(),
                    cursorParts.id(),
                    PageRequest.of(0, pageSize)
            );
        }

        Map<Long, List<FeedPostMediaResponse>> mediaByPost = loadMediaByPost(posts);
        Map<Long, Long> likesCountByPost = loadLikeCountsByPost(posts);
        Map<Long, List<FeedCommentResponse>> commentsByPost = loadCommentsByPost(posts);
        List<FeedPostResponse> items = posts.stream()
                .map(post -> toResponse(
                        post,
                        mediaByPost.getOrDefault(post.getId(), List.of()),
                        likesCountByPost.getOrDefault(post.getId(), 0L),
                        commentsByPost.getOrDefault(post.getId(), List.of())
                ))
                .toList();

        String nextCursor = items.isEmpty() ? null : buildCursor(items.get(items.size() - 1).createdAt(), items.get(items.size() - 1).id());
        log.debug("Feed page loaded itemCount={} hasNext={}", items.size(), nextCursor != null);
        return new FeedPageResponse(items, nextCursor);
    }

    @Transactional
    public FeedPostResponse createPost(AppUserPrincipal principal, CreateFeedPostRequest request) {
        String text = request.text() == null ? "" : request.text().trim();
        List<CreateFeedPostMediaRequest> media = request.media() == null ? List.of() : request.media();
        if (text.isBlank() && media.isEmpty()) {
            log.warn("Rejected empty post create attempt userId={}", principal.getId());
            throw new IllegalArgumentException("Post must contain text or media");
        }

        UserEntity author = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        FeedPostEntity post = new FeedPostEntity();
        post.setAuthor(author);
        post.setBodyText(text.isBlank() ? null : text);
        FeedPostEntity savedPost = feedPostRepository.save(post);

        List<FeedPostMediaResponse> mediaResponses = new ArrayList<>();
        for (int i = 0; i < media.size(); i++) {
            CreateFeedPostMediaRequest item = media.get(i);
            FeedPostMediaEntity mediaEntity = new FeedPostMediaEntity();
            mediaEntity.setPost(savedPost);
            mediaEntity.setMediaType(item.type());
            mediaEntity.setMediaUrl(item.url().trim());
            mediaEntity.setSortOrder(i);
            feedPostMediaRepository.save(mediaEntity);
            mediaResponses.add(new FeedPostMediaResponse(item.type(), item.url().trim()));
        }

        log.info("Feed post created postId={} authorUserId={} textLength={} mediaCount={}",
                savedPost.getId(), author.getId(), text.length(), mediaResponses.size());
        return toResponse(savedPost, mediaResponses, 0, List.of());
    }

    @Transactional
    public FeedLikeResponse likePost(Long postId, AppUserPrincipal principal) {
        FeedPostEntity post = feedPostRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!feedPostLikeRepository.existsByPostIdAndUserId(postId, principal.getId())) {
            FeedPostLikeEntity like = new FeedPostLikeEntity();
            like.setPost(post);
            like.setUser(user);
            feedPostLikeRepository.save(like);
            log.info("Post liked postId={} userId={}", postId, principal.getId());
        } else {
            log.debug("Like already exists postId={} userId={}", postId, principal.getId());
        }

        long count = feedPostLikeRepository.countByPostIds(List.of(postId)).stream()
                .findFirst().map(PostCountProjection::getTotalCount).orElse(0L);
        return new FeedLikeResponse(postId, true, count);
    }

    @Transactional
    public FeedLikeResponse unlikePost(Long postId, AppUserPrincipal principal) {
        if (!feedPostRepository.existsById(postId)) {
            throw new NotFoundException("Post not found");
        }
        feedPostLikeRepository.deleteByPostIdAndUserId(postId, principal.getId());
        log.info("Post unliked postId={} userId={}", postId, principal.getId());

        long count = feedPostLikeRepository.countByPostIds(List.of(postId)).stream()
                .findFirst().map(PostCountProjection::getTotalCount).orElse(0L);
        return new FeedLikeResponse(postId, false, count);
    }

    @Transactional
    public FeedCommentResponse addComment(Long postId, AppUserPrincipal principal, CreateFeedCommentRequest request) {
        FeedPostEntity post = feedPostRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));
        UserEntity author = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        FeedPostCommentEntity comment = new FeedPostCommentEntity();
        comment.setPost(post);
        comment.setAuthor(author);
        comment.setBodyText(request.text().trim());
        FeedPostCommentEntity saved = feedPostCommentRepository.save(comment);

        log.info("Post comment created commentId={} postId={} authorUserId={}",
                saved.getId(), postId, principal.getId());
        return toCommentResponse(saved);
    }

    @Transactional
    public void deleteOwnPost(Long postId, AppUserPrincipal principal) {
        FeedPostEntity post = feedPostRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));
        if (!post.getAuthor().getId().equals(principal.getId())) {
            log.warn("Delete post denied postId={} requesterUserId={} ownerUserId={}",
                    postId, principal.getId(), post.getAuthor().getId());
            throw new AccessDeniedException("You can only delete your own posts");
        }
        feedPostRepository.delete(post);
        log.info("Post deleted postId={} by ownerUserId={}", postId, principal.getId());
    }

    private Map<Long, List<FeedPostMediaResponse>> loadMediaByPost(List<FeedPostEntity> posts) {
        List<Long> postIds = posts.stream().map(FeedPostEntity::getId).toList();
        if (postIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, List<FeedPostMediaResponse>> grouped = new HashMap<>();
        feedPostMediaRepository.findByPostIdInOrderBySortOrderAscIdAsc(postIds).forEach(media -> {
            grouped.computeIfAbsent(media.getPost().getId(), ignored -> new ArrayList<>())
                    .add(new FeedPostMediaResponse(media.getMediaType(), media.getMediaUrl()));
        });
        return grouped;
    }

    private Map<Long, Long> loadLikeCountsByPost(List<FeedPostEntity> posts) {
        List<Long> postIds = posts.stream().map(FeedPostEntity::getId).toList();
        if (postIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Long> grouped = new HashMap<>();
        feedPostLikeRepository.countByPostIds(postIds)
                .forEach(c -> grouped.put(c.getPostId(), c.getTotalCount()));
        return grouped;
    }

    private Map<Long, List<FeedCommentResponse>> loadCommentsByPost(List<FeedPostEntity> posts) {
        List<Long> postIds = posts.stream().map(FeedPostEntity::getId).toList();
        if (postIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, List<FeedCommentResponse>> grouped = new HashMap<>();
        feedPostCommentRepository.findByPostIdInOrderByCreatedAtAscIdAsc(postIds)
                .forEach(comment -> grouped.computeIfAbsent(comment.getPost().getId(), ignored -> new ArrayList<>())
                        .add(toCommentResponse(comment)));
        return grouped;
    }

    private FeedCommentResponse toCommentResponse(FeedPostCommentEntity comment) {
        return new FeedCommentResponse(
                comment.getId(),
                comment.getAuthor().getId(),
                comment.getAuthor().getFullName(),
                comment.getBodyText(),
                comment.getCreatedAt()
        );
    }

    private FeedPostResponse toResponse(
            FeedPostEntity post,
            List<FeedPostMediaResponse> media,
            long likesCount,
            List<FeedCommentResponse> comments
    ) {
        return new FeedPostResponse(
                post.getId(),
                post.getAuthor().getId(),
                post.getAuthor().getFullName(),
                post.getBodyText(),
                post.getCreatedAt(),
                media,
                likesCount,
                comments.size(),
                comments
        );
    }

    private CursorParts parseCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return new CursorParts(null, null);
        }
        String[] parts = cursor.split("_");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid cursor");
        }
        try {
            Instant createdAt = Instant.ofEpochMilli(Long.parseLong(parts[0]));
            Long id = Long.parseLong(parts[1]);
            return new CursorParts(createdAt, id);
        } catch (NumberFormatException ex) {
            log.warn("Invalid feed cursor format cursor={}", cursor);
            throw new IllegalArgumentException("Invalid cursor");
        }
    }

    private String buildCursor(Instant createdAt, Long id) {
        return createdAt.toEpochMilli() + "_" + id;
    }

    private record CursorParts(Instant createdAt, Long id) {
    }
}
