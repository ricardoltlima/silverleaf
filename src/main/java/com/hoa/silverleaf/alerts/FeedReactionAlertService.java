package com.hoa.silverleaf.alerts;

import com.hoa.silverleaf.alerts.dto.FeedReactionAlertResponse;
import com.hoa.silverleaf.community.CommunityAccessService;
import com.hoa.silverleaf.feed.FeedPostEntity;
import com.hoa.silverleaf.feed.FeedReactionType;
import com.hoa.silverleaf.security.AppUserPrincipal;
import com.hoa.silverleaf.users.UserEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class FeedReactionAlertService {

    private final FeedReactionAlertRepository feedReactionAlertRepository;
    private final CommunityAccessService communityAccessService;

    public FeedReactionAlertService(
            FeedReactionAlertRepository feedReactionAlertRepository,
            CommunityAccessService communityAccessService
    ) {
        this.feedReactionAlertRepository = feedReactionAlertRepository;
        this.communityAccessService = communityAccessService;
    }

    @Transactional
    public void recordPositiveReaction(FeedPostEntity post, UserEntity actor, FeedReactionType reactionType) {
        if (!isPositiveReaction(reactionType) || post.getAuthor().getId().equals(actor.getId())) {
            return;
        }
        Instant now = Instant.now();
        FeedReactionAlertEntity alert = feedReactionAlertRepository
                .findByCommunityIdAndRecipientIdAndActorIdAndPostId(
                        post.getCommunity().getId(),
                        post.getAuthor().getId(),
                        actor.getId(),
                        post.getId()
                )
                .orElseGet(FeedReactionAlertEntity::new);
        alert.setCommunity(post.getCommunity());
        alert.setRecipient(post.getAuthor());
        alert.setActor(actor);
        alert.setPost(post);
        alert.setReactionType(reactionType);
        alert.setLastReactedAt(now);
        alert.setReadAt(null);
        feedReactionAlertRepository.save(alert);
    }

    @Transactional(readOnly = true)
    public List<FeedReactionAlertResponse> listForCurrentUser(AppUserPrincipal principal) {
        Long communityId = communityAccessService.requireCommunityIdForPrincipal(principal);
        return feedReactionAlertRepository.findAllByRecipientIdAndCommunityIdOrderByLastReactedAtDescIdDesc(principal.getId(), communityId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void markAllRead(AppUserPrincipal principal) {
        Long communityId = communityAccessService.requireCommunityIdForPrincipal(principal);
        List<FeedReactionAlertEntity> alerts = feedReactionAlertRepository
                .findAllByRecipientIdAndCommunityIdOrderByLastReactedAtDescIdDesc(principal.getId(), communityId);
        Instant now = Instant.now();
        boolean changed = false;
        for (FeedReactionAlertEntity alert : alerts) {
            if (alert.getReadAt() == null) {
                alert.setReadAt(now);
                changed = true;
            }
        }
        if (changed) {
            feedReactionAlertRepository.saveAll(alerts);
        }
    }

    @Transactional
    public void deleteByPostId(Long postId) {
        feedReactionAlertRepository.deleteByPostId(postId);
    }

    private FeedReactionAlertResponse toResponse(FeedReactionAlertEntity alert) {
        return new FeedReactionAlertResponse(
                alert.getId(),
                alert.getPost().getId(),
                alert.getPost().getChannel().name(),
                alert.getPost().getGroupSlug(),
                alert.getActor().getId(),
                alert.getActor().getFullName(),
                alert.getActor().getPhotoUrl(),
                alert.getReactionType().name(),
                buildPreview(alert.getPost().getBodyText()),
                alert.getLastReactedAt().toString(),
                alert.getReadAt() == null
        );
    }

    private String buildPreview(String bodyText) {
        if (bodyText == null || bodyText.isBlank()) {
            return "Reacted to your post";
        }
        String trimmed = bodyText.trim();
        return trimmed.length() > 140 ? trimmed.substring(0, 137) + "..." : trimmed;
    }

    private boolean isPositiveReaction(FeedReactionType reactionType) {
        return reactionType == FeedReactionType.HEART || reactionType == FeedReactionType.CLAP;
    }
}
