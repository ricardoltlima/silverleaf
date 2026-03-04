package com.hoa.silverleaf.alerts;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeedReactionAlertRepository extends JpaRepository<FeedReactionAlertEntity, Long> {

    Optional<FeedReactionAlertEntity> findByCommunityIdAndRecipientIdAndActorIdAndPostId(
            Long communityId,
            Long recipientId,
            Long actorId,
            Long postId
    );

    List<FeedReactionAlertEntity> findAllByRecipientIdAndCommunityIdOrderByLastReactedAtDescIdDesc(Long recipientId, Long communityId);

    void deleteByPostId(Long postId);
}
