package com.hoa.silverleaf.messages;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DirectMessageRepository extends JpaRepository<DirectMessageEntity, Long> {
    List<DirectMessageEntity> findBySenderIdOrRecipientIdOrderByCreatedAtDescIdDesc(Long senderId, Long recipientId);

    List<DirectMessageEntity> findBySenderIdAndRecipientIdOrSenderIdAndRecipientIdOrderByCreatedAtAscIdAsc(
            Long senderId,
            Long recipientId,
            Long reverseSenderId,
            Long reverseRecipientId
    );

    long countByRecipientIdAndReadAtIsNull(Long recipientId);
}
