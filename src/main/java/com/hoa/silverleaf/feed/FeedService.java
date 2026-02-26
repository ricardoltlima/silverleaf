package com.hoa.silverleaf.feed;

import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.feed.dto.CreateFeedPostMediaRequest;
import com.hoa.silverleaf.feed.dto.FeedCommentReactionResponse;
import com.hoa.silverleaf.feed.dto.CreateFeedCommentRequest;
import com.hoa.silverleaf.feed.dto.FeedAuthorServiceResponse;
import com.hoa.silverleaf.feed.dto.FeedCommentResponse;
import com.hoa.silverleaf.feed.dto.FeedLikeResponse;
import com.hoa.silverleaf.feed.dto.CreateFeedPostRequest;
import com.hoa.silverleaf.feed.dto.FeedReplyCreatedEvent;
import com.hoa.silverleaf.feed.dto.FeedPageResponse;
import com.hoa.silverleaf.feed.dto.FeedPostMediaResponse;
import com.hoa.silverleaf.feed.dto.FeedPostResponse;
import com.hoa.silverleaf.groups.GroupService;
import com.hoa.silverleaf.security.AppUserPrincipal;
import com.hoa.silverleaf.users.UserEntity;
import com.hoa.silverleaf.users.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
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
    private final FeedCommentReactionRepository feedCommentReactionRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final GroupService groupService;

    public FeedService(
            FeedPostRepository feedPostRepository,
            FeedPostMediaRepository feedPostMediaRepository,
            FeedPostLikeRepository feedPostLikeRepository,
            FeedPostCommentRepository feedPostCommentRepository,
            FeedCommentReactionRepository feedCommentReactionRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate,
            GroupService groupService
    ) {
        this.feedPostRepository = feedPostRepository;
        this.feedPostMediaRepository = feedPostMediaRepository;
        this.feedPostLikeRepository = feedPostLikeRepository;
        this.feedPostCommentRepository = feedPostCommentRepository;
        this.feedCommentReactionRepository = feedCommentReactionRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.groupService = groupService;
    }

    @Transactional(readOnly = true)
    public FeedPageResponse getFeed(
            AppUserPrincipal principal,
            String cursor,
            int limit,
            FeedChannel channel,
            String groupSlug
    ) {
        // Cursor-based pagination keeps reads stable for infinite-scroll clients.
        int pageSize = Math.max(1, Math.min(limit, 50));
        CursorParts cursorParts = parseCursor(cursor);
        log.debug("Loading feed page pageSize={} cursorCreatedAt={} cursorPostId={}",
                pageSize, cursorParts.createdAt(), cursorParts.id());
        List<FeedPostEntity> posts;
        boolean groupedFeed = channel == FeedChannel.GROUP && groupSlug != null && !groupSlug.isBlank();
        List<String> accessibleGroupSlugs = List.of();
        if (channel == FeedChannel.GROUP) {
            accessibleGroupSlugs = groupService.findAccessibleGroupSlugs(principal.getId());
            if (groupedFeed) {
                groupService.requireAccessibleGroup(principal.getId(), normalizeGroupSlug(groupSlug));
            }
            if (!groupedFeed && accessibleGroupSlugs.isEmpty()) {
                return new FeedPageResponse(List.of(), null);
            }
        }
        if (cursorParts.createdAt() == null || cursorParts.id() == null) {
            posts = groupedFeed
                    ? feedPostRepository.findByChannelAndGroupSlugOrderByCreatedAtDescIdDesc(
                            channel,
                            normalizeGroupSlug(groupSlug),
                            PageRequest.of(0, pageSize)
                    )
                    : (channel == FeedChannel.GROUP
                        ? feedPostRepository.findByChannelAndGroupSlugInOrderByCreatedAtDescIdDesc(
                                channel,
                                accessibleGroupSlugs,
                                PageRequest.of(0, pageSize)
                        )
                        : feedPostRepository.findByChannelOrderByCreatedAtDescIdDesc(channel, PageRequest.of(0, pageSize)));
        } else {
            posts = groupedFeed
                    ? feedPostRepository.findFeedAfterCursorForGroup(
                            channel,
                            normalizeGroupSlug(groupSlug),
                            cursorParts.createdAt(),
                            cursorParts.id(),
                            PageRequest.of(0, pageSize)
                    )
                    : (channel == FeedChannel.GROUP
                        ? feedPostRepository.findFeedAfterCursorForGroupSlugs(
                                channel,
                                accessibleGroupSlugs,
                                cursorParts.createdAt(),
                                cursorParts.id(),
                                PageRequest.of(0, pageSize)
                        )
                        : feedPostRepository.findFeedAfterCursor(
                                channel,
                                cursorParts.createdAt(),
                                cursorParts.id(),
                                PageRequest.of(0, pageSize)
                        ));
        }

        Map<Long, List<FeedPostMediaResponse>> mediaByPost = loadMediaByPost(posts);
        Map<Long, EnumMap<FeedReactionType, Long>> reactionCountsByPost = loadReactionCountsByPost(posts);
        Map<Long, FeedReactionType> viewerReactionByPost = loadViewerReactionByPost(posts, principal.getId());
        Map<Long, List<FeedCommentResponse>> commentsByPost = loadCommentsByPost(posts, principal.getId());
        List<FeedPostResponse> items = posts.stream()
                .map(post -> toResponse(
                        post,
                        mediaByPost.getOrDefault(post.getId(), List.of()),
                        reactionCountsByPost.getOrDefault(post.getId(), new EnumMap<>(FeedReactionType.class)),
                        viewerReactionByPost.get(post.getId()),
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
        FeedChannel channel = request.channel() == null ? FeedChannel.COMMUNITY : request.channel();
        String groupSlug = request.groupSlug() == null ? null : normalizeGroupSlug(request.groupSlug());
        if (text.isBlank() && media.isEmpty()) {
            log.warn("Rejected empty post create attempt userId={}", principal.getId());
            throw new IllegalArgumentException("Post must contain text or media");
        }
        if (channel == FeedChannel.GROUP && (groupSlug == null || groupSlug.isBlank())) {
            throw new IllegalArgumentException("Group slug is required for group posts");
        }
        if (channel == FeedChannel.GROUP) {
            groupService.requireAccessibleGroup(principal.getId(), groupSlug);
        }

        UserEntity author = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        FeedPostEntity post = new FeedPostEntity();
        post.setAuthor(author);
        post.setBodyText(text.isBlank() ? null : text);
        post.setChannel(channel);
        post.setGroupSlug(groupSlug);
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

        log.info("Feed post created postId={} authorUserId={} channel={} textLength={} mediaCount={}",
                savedPost.getId(), author.getId(), channel, text.length(), mediaResponses.size());
        return toResponse(savedPost, mediaResponses, new EnumMap<>(FeedReactionType.class), null, List.of());
    }

    @Transactional
    public FeedLikeResponse likePost(Long postId, AppUserPrincipal principal, FeedReactionType reactionType) {
        FeedPostEntity post = feedPostRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        FeedPostLikeEntity existing = feedPostLikeRepository.findByPostIdAndUserId(postId, principal.getId()).orElse(null);
        if (existing == null) {
            FeedPostLikeEntity like = new FeedPostLikeEntity();
            like.setPost(post);
            like.setUser(user);
            like.setReactionType(reactionType);
            feedPostLikeRepository.save(like);
            log.info("Post reaction created postId={} userId={} reaction={}", postId, principal.getId(), reactionType);
        } else if (existing.getReactionType() != reactionType) {
            existing.setReactionType(reactionType);
            feedPostLikeRepository.save(existing);
            log.info("Post reaction updated postId={} userId={} reaction={}", postId, principal.getId(), reactionType);
        } else {
            log.debug("Post reaction already present postId={} userId={} reaction={}", postId, principal.getId(), reactionType);
        }

        EnumMap<FeedReactionType, Long> counts = loadReactionCountsByPostIds(List.of(postId))
                .getOrDefault(postId, new EnumMap<>(FeedReactionType.class));
        return new FeedLikeResponse(postId, reactionType.name(), totalReactions(counts), toStringMap(counts));
    }

    @Transactional
    public FeedLikeResponse unlikePost(Long postId, AppUserPrincipal principal) {
        if (!feedPostRepository.existsById(postId)) {
            throw new NotFoundException("Post not found");
        }
        feedPostLikeRepository.deleteByPostIdAndUserId(postId, principal.getId());
        log.info("Post unliked postId={} userId={}", postId, principal.getId());

        EnumMap<FeedReactionType, Long> counts = loadReactionCountsByPostIds(List.of(postId))
                .getOrDefault(postId, new EnumMap<>(FeedReactionType.class));
        return new FeedLikeResponse(postId, null, totalReactions(counts), toStringMap(counts));
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
        FeedCommentResponse response = toCommentResponse(saved, new EnumMap<>(FeedReactionType.class), null);
        messagingTemplate.convertAndSend("/topic/feed", new FeedReplyCreatedEvent(postId, response));
        return response;
    }

    @Transactional
    public FeedCommentReactionResponse reactToComment(Long commentId, AppUserPrincipal principal, FeedReactionType reactionType) {
        FeedPostCommentEntity comment = feedPostCommentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException("Comment not found"));
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        FeedCommentReactionEntity existing = feedCommentReactionRepository.findByCommentIdAndUserId(commentId, principal.getId()).orElse(null);
        if (existing == null) {
            FeedCommentReactionEntity reaction = new FeedCommentReactionEntity();
            reaction.setComment(comment);
            reaction.setUser(user);
            reaction.setReactionType(reactionType);
            feedCommentReactionRepository.save(reaction);
        } else if (existing.getReactionType() != reactionType) {
            existing.setReactionType(reactionType);
            feedCommentReactionRepository.save(existing);
        }

        EnumMap<FeedReactionType, Long> counts = loadCommentReactionCountsByIds(List.of(commentId))
                .getOrDefault(commentId, new EnumMap<>(FeedReactionType.class));
        return new FeedCommentReactionResponse(commentId, reactionType.name(), totalReactions(counts), toStringMap(counts));
    }

    @Transactional
    public FeedCommentReactionResponse clearCommentReaction(Long commentId, AppUserPrincipal principal) {
        if (!feedPostCommentRepository.existsById(commentId)) {
            throw new NotFoundException("Comment not found");
        }
        feedCommentReactionRepository.deleteByCommentIdAndUserId(commentId, principal.getId());
        EnumMap<FeedReactionType, Long> counts = loadCommentReactionCountsByIds(List.of(commentId))
                .getOrDefault(commentId, new EnumMap<>(FeedReactionType.class));
        return new FeedCommentReactionResponse(commentId, null, totalReactions(counts), toStringMap(counts));
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

    private Map<Long, EnumMap<FeedReactionType, Long>> loadReactionCountsByPost(List<FeedPostEntity> posts) {
        List<Long> postIds = posts.stream().map(FeedPostEntity::getId).toList();
        return loadReactionCountsByPostIds(postIds);
    }

    private Map<Long, EnumMap<FeedReactionType, Long>> loadReactionCountsByPostIds(List<Long> postIds) {
        if (postIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, EnumMap<FeedReactionType, Long>> grouped = new HashMap<>();
        feedPostLikeRepository.countByPostIdsGroupedByReaction(postIds)
                .forEach(c -> grouped
                        .computeIfAbsent(c.getPostId(), ignored -> new EnumMap<>(FeedReactionType.class))
                        .put(c.getReactionType(), c.getTotalCount()));
        return grouped;
    }

    private Map<Long, FeedReactionType> loadViewerReactionByPost(List<FeedPostEntity> posts, Long userId) {
        List<Long> postIds = posts.stream().map(FeedPostEntity::getId).toList();
        if (postIds.isEmpty() || userId == null) {
            return Map.of();
        }
        Map<Long, FeedReactionType> grouped = new HashMap<>();
        feedPostLikeRepository.findByPostIdInAndUserId(postIds, userId)
                .forEach(like -> grouped.put(like.getPost().getId(), like.getReactionType()));
        return grouped;
    }

    private Map<Long, List<FeedCommentResponse>> loadCommentsByPost(List<FeedPostEntity> posts, Long viewerUserId) {
        List<Long> postIds = posts.stream().map(FeedPostEntity::getId).toList();
        if (postIds.isEmpty()) {
            return Map.of();
        }
        List<FeedPostCommentEntity> comments = feedPostCommentRepository.findByPostIdInOrderByCreatedAtAscIdAsc(postIds);
        List<Long> commentIds = comments.stream().map(FeedPostCommentEntity::getId).toList();
        Map<Long, EnumMap<FeedReactionType, Long>> reactionCountsByComment = loadCommentReactionCountsByIds(commentIds);
        Map<Long, FeedReactionType> viewerReactionByComment = loadViewerCommentReactionByIds(commentIds, viewerUserId);

        Map<Long, List<FeedCommentResponse>> grouped = new HashMap<>();
        comments.forEach(comment -> grouped.computeIfAbsent(comment.getPost().getId(), ignored -> new ArrayList<>())
                .add(toCommentResponse(
                        comment,
                        reactionCountsByComment.getOrDefault(comment.getId(), new EnumMap<>(FeedReactionType.class)),
                        viewerReactionByComment.get(comment.getId())
                )));
        return grouped;
    }

    private FeedCommentResponse toCommentResponse(
            FeedPostCommentEntity comment,
            EnumMap<FeedReactionType, Long> reactionCounts,
            FeedReactionType viewerReaction
    ) {
        return new FeedCommentResponse(
                comment.getId(),
                comment.getAuthor().getId(),
                comment.getAuthor().getFullName(),
                comment.getAuthor().getPhotoUrl(),
                comment.getBodyText(),
                comment.getCreatedAt(),
                totalReactions(reactionCounts),
                toStringMap(reactionCounts),
                viewerReaction == null ? null : viewerReaction.name()
        );
    }

    private Map<Long, EnumMap<FeedReactionType, Long>> loadCommentReactionCountsByIds(List<Long> commentIds) {
        if (commentIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, EnumMap<FeedReactionType, Long>> grouped = new HashMap<>();
        feedCommentReactionRepository.countByCommentIdsGroupedByReaction(commentIds)
                .forEach(c -> grouped
                        .computeIfAbsent(c.getCommentId(), ignored -> new EnumMap<>(FeedReactionType.class))
                        .put(c.getReactionType(), c.getTotalCount()));
        return grouped;
    }

    private Map<Long, FeedReactionType> loadViewerCommentReactionByIds(List<Long> commentIds, Long userId) {
        if (commentIds.isEmpty() || userId == null) {
            return Map.of();
        }
        Map<Long, FeedReactionType> grouped = new HashMap<>();
        feedCommentReactionRepository.findByCommentIdInAndUserId(commentIds, userId)
                .forEach(reaction -> grouped.put(reaction.getComment().getId(), reaction.getReactionType()));
        return grouped;
    }

    private FeedPostResponse toResponse(
            FeedPostEntity post,
            List<FeedPostMediaResponse> media,
            EnumMap<FeedReactionType, Long> reactionCounts,
            FeedReactionType viewerReaction,
            List<FeedCommentResponse> comments
    ) {
        return new FeedPostResponse(
                post.getId(),
                post.getChannel().name(),
                post.getGroupSlug(),
                post.getAuthor().getId(),
                post.getAuthor().getFullName(),
                post.getAuthor().getPhotoUrl(),
                toAuthorService(post.getAuthor()),
                post.getBodyText(),
                post.getCreatedAt(),
                media,
                totalReactions(reactionCounts),
                toStringMap(reactionCounts),
                viewerReaction == null ? null : viewerReaction.name(),
                comments.size(),
                comments
        );
    }

    private String normalizeGroupSlug(String groupSlug) {
        return groupSlug == null ? null : groupSlug.trim().toLowerCase();
    }

    private FeedAuthorServiceResponse toAuthorService(UserEntity author) {
        if (!author.isServiceEnabled()) {
            return null;
        }
        return new FeedAuthorServiceResponse(
                author.getServiceTitle(),
                author.getServiceDescription(),
                author.getServiceContactPhone(),
                author.getServiceContactEmail(),
                author.getServiceBusinessUrl(),
                author.getServiceHours(),
                author.getServiceArea(),
                author.getServiceVisibility() == null ? null : author.getServiceVisibility().name()
        );
    }

    private long totalReactions(EnumMap<FeedReactionType, Long> reactionCounts) {
        return reactionCounts.values().stream().mapToLong(Long::longValue).sum();
    }

    private Map<String, Long> toStringMap(EnumMap<FeedReactionType, Long> reactionCounts) {
        Map<String, Long> response = new HashMap<>();
        for (FeedReactionType reactionType : FeedReactionType.values()) {
            response.put(reactionType.name(), reactionCounts.getOrDefault(reactionType, 0L));
        }
        return response;
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
