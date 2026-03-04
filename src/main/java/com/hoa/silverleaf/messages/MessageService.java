package com.hoa.silverleaf.messages;

import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.community.CommunityAccessService;
import com.hoa.silverleaf.messages.dto.CreateDirectMessageRequest;
import com.hoa.silverleaf.messages.dto.DirectConversationResponse;
import com.hoa.silverleaf.messages.dto.DirectMessageResponse;
import com.hoa.silverleaf.messages.dto.UnreadCountResponse;
import com.hoa.silverleaf.security.AppUserPrincipal;
import com.hoa.silverleaf.users.UserEntity;
import com.hoa.silverleaf.users.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class MessageService {

    private final DirectMessageRepository directMessageRepository;
    private final UserRepository userRepository;
    private final CommunityAccessService communityAccessService;

    public MessageService(
            DirectMessageRepository directMessageRepository,
            UserRepository userRepository,
            CommunityAccessService communityAccessService
    ) {
        this.directMessageRepository = directMessageRepository;
        this.userRepository = userRepository;
        this.communityAccessService = communityAccessService;
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse unreadCount(AppUserPrincipal principal) {
        long count = directMessageRepository.countByCommunityIdAndRecipientIdAndReadAtIsNull(
                communityAccessService.requireCommunityIdForPrincipal(principal),
                principal.getId()
        );
        return new UnreadCountResponse(count);
    }

    @Transactional(readOnly = true)
    public List<DirectConversationResponse> conversations(AppUserPrincipal principal) {
        Long myUserId = principal.getId();
        Long communityId = communityAccessService.requireCommunityIdForPrincipal(principal);
        List<DirectMessageEntity> messages =
                directMessageRepository.findByCommunityIdAndSenderIdOrCommunityIdAndRecipientIdOrderByCreatedAtDescIdDesc(
                        communityId, myUserId, communityId, myUserId
                );

        Map<Long, DirectConversationAccumulator> byOtherUser = new LinkedHashMap<>();
        for (DirectMessageEntity message : messages) {
            Long otherUserId = message.getSender().getId().equals(myUserId)
                    ? message.getRecipient().getId()
                    : message.getSender().getId();
            UserEntity otherUser = message.getSender().getId().equals(myUserId)
                    ? message.getRecipient()
                    : message.getSender();
            DirectConversationAccumulator accumulator = byOtherUser.computeIfAbsent(otherUserId, ignored ->
                    new DirectConversationAccumulator(
                            otherUserId,
                            otherUser.getFullName(),
                            otherUser.getPhotoUrl(),
                            message.getBodyText(),
                            message.getCreatedAt(),
                            0
                    )
            );
            if (message.getRecipient().getId().equals(myUserId) && message.getReadAt() == null) {
                accumulator.unreadCount += 1;
            }
        }

        List<DirectConversationResponse> response = new ArrayList<>();
        byOtherUser.values().forEach(conversation -> response.add(new DirectConversationResponse(
                conversation.otherUserId,
                conversation.otherUserName,
                conversation.otherUserPhotoUrl,
                conversation.lastMessage,
                conversation.lastMessageAt,
                conversation.unreadCount
        )));
        return response;
    }

    @Transactional(readOnly = true)
    public List<DirectMessageResponse> thread(AppUserPrincipal principal, Long otherUserId) {
        communityAccessService.requireUsersInSameCommunity(principal, otherUserId);
        Long communityId = communityAccessService.requireCommunityIdForPrincipal(principal);
        UserEntity otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new NotFoundException("Recipient user not found"));
        List<DirectMessageEntity> messages =
                directMessageRepository.findByCommunityIdAndSenderIdAndRecipientIdOrCommunityIdAndSenderIdAndRecipientIdOrderByCreatedAtAscIdAsc(
                        communityId, principal.getId(), otherUserId, communityId, otherUserId, principal.getId()
                );
        return messages.stream().map(this::toResponse).toList();
    }

    @Transactional
    public DirectMessageResponse send(AppUserPrincipal principal, CreateDirectMessageRequest request) {
        if (principal.getId().equals(request.recipientUserId())) {
            throw new IllegalArgumentException("Cannot send message to yourself");
        }
        UserEntity sender = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("Sender not found"));
        UserEntity recipient = userRepository.findById(request.recipientUserId())
                .orElseThrow(() -> new NotFoundException("Recipient user not found"));
        communityAccessService.requireUsersInSameCommunity(principal, recipient.getId());

        DirectMessageEntity message = new DirectMessageEntity();
        message.setCommunity(communityAccessService.requireCommunityForPrincipal(principal));
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setBodyText(request.body().trim());
        DirectMessageEntity saved = directMessageRepository.save(message);
        log.info("Direct message sent senderUserId={} recipientUserId={} messageId={}",
                sender.getId(), recipient.getId(), saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public void markThreadAsRead(AppUserPrincipal principal, Long otherUserId) {
        communityAccessService.requireUsersInSameCommunity(principal, otherUserId);
        Long communityId = communityAccessService.requireCommunityIdForPrincipal(principal);
        Instant now = Instant.now();
        List<DirectMessageEntity> messages =
                directMessageRepository.findByCommunityIdAndSenderIdAndRecipientIdOrCommunityIdAndSenderIdAndRecipientIdOrderByCreatedAtAscIdAsc(
                        communityId, principal.getId(), otherUserId, communityId, otherUserId, principal.getId()
                );
        int updated = 0;
        for (DirectMessageEntity message : messages) {
            if (message.getRecipient().getId().equals(principal.getId()) && message.getReadAt() == null) {
                message.setReadAt(now);
                updated += 1;
            }
        }
        if (updated > 0) {
            directMessageRepository.saveAll(messages);
            log.debug("Marked thread as read currentUserId={} otherUserId={} updatedMessages={}",
                    principal.getId(), otherUserId, updated);
        }
    }

    private DirectMessageResponse toResponse(DirectMessageEntity message) {
        return new DirectMessageResponse(
                message.getId(),
                message.getSender().getId(),
                message.getSender().getFullName(),
                message.getSender().getPhotoUrl(),
                message.getRecipient().getId(),
                message.getRecipient().getFullName(),
                message.getRecipient().getPhotoUrl(),
                message.getBodyText(),
                message.getCreatedAt(),
                message.getReadAt()
        );
    }

    private static class DirectConversationAccumulator {
        private final Long otherUserId;
        private final String otherUserName;
        private final String otherUserPhotoUrl;
        private final String lastMessage;
        private final Instant lastMessageAt;
        private long unreadCount;

        private DirectConversationAccumulator(
                Long otherUserId,
                String otherUserName,
                String otherUserPhotoUrl,
                String lastMessage,
                Instant lastMessageAt,
                long unreadCount
        ) {
            this.otherUserId = otherUserId;
            this.otherUserName = otherUserName;
            this.otherUserPhotoUrl = otherUserPhotoUrl;
            this.lastMessage = lastMessage;
            this.lastMessageAt = lastMessageAt;
            this.unreadCount = unreadCount;
        }
    }
}
