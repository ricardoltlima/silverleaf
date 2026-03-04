package com.hoa.silverleaf.messages;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DirectMessageRepository extends JpaRepository<DirectMessageEntity, Long> {
    List<DirectMessageEntity> findByCommunityIdAndSenderIdOrCommunityIdAndRecipientIdOrderByCreatedAtDescIdDesc(
            Long senderCommunityId,
            Long senderId,
            Long recipientCommunityId,
            Long recipientId
    );

    List<DirectMessageEntity> findByCommunityIdAndSenderIdAndRecipientIdOrCommunityIdAndSenderIdAndRecipientIdOrderByCreatedAtAscIdAsc(
            Long firstCommunityId,
            Long senderId,
            Long recipientId,
            Long secondCommunityId,
            Long reverseSenderId,
            Long reverseRecipientId
    );

    long countByCommunityIdAndRecipientIdAndReadAtIsNull(Long communityId, Long recipientId);
}
