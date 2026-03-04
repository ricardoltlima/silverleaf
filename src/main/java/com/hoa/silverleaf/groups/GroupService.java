package com.hoa.silverleaf.groups;

import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.community.CommunityAccessService;
import com.hoa.silverleaf.groups.dto.CreateGroupRequest;
import com.hoa.silverleaf.groups.dto.GroupJoinRequestResponse;
import com.hoa.silverleaf.groups.dto.GroupResponse;
import com.hoa.silverleaf.security.AppUserPrincipal;
import com.hoa.silverleaf.users.UserEntity;
import com.hoa.silverleaf.users.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class GroupService {

    private final ResidentGroupRepository residentGroupRepository;
    private final ResidentGroupMemberRepository residentGroupMemberRepository;
    private final ResidentGroupJoinRequestRepository residentGroupJoinRequestRepository;
    private final UserRepository userRepository;
    private final CommunityAccessService communityAccessService;

    public GroupService(
            ResidentGroupRepository residentGroupRepository,
            ResidentGroupMemberRepository residentGroupMemberRepository,
            ResidentGroupJoinRequestRepository residentGroupJoinRequestRepository,
            UserRepository userRepository,
            CommunityAccessService communityAccessService
    ) {
        this.residentGroupRepository = residentGroupRepository;
        this.residentGroupMemberRepository = residentGroupMemberRepository;
        this.residentGroupJoinRequestRepository = residentGroupJoinRequestRepository;
        this.userRepository = userRepository;
        this.communityAccessService = communityAccessService;
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> listGroupsForUser(AppUserPrincipal principal) {
        Long userId = principal.getId();
        Long communityId = communityAccessService.requireCommunityIdForPrincipal(principal);
        List<ResidentGroupEntity> allGroups = residentGroupRepository.findAllByCommunityIdOrderByNameAsc(communityId);
        List<Long> memberGroupIds = residentGroupMemberRepository.findGroupIdsByUserIdAndCommunityId(userId, communityId);
        List<Long> allGroupIds = allGroups.stream().map(ResidentGroupEntity::getId).toList();
        Map<Long, Long> memberCountByGroupId = new HashMap<>();
        if (!allGroupIds.isEmpty()) {
            residentGroupMemberRepository.countMembersByGroupIds(allGroupIds)
                    .forEach(row -> memberCountByGroupId.put(row.getGroupId(), row.getTotalCount()));
        }
        Set<Long> subscribedIds = new LinkedHashSet<>(memberGroupIds);
        Map<Long, ResidentGroupJoinRequestEntity> viewerRequestsByGroupId = new HashMap<>();
        for (ResidentGroupEntity group : allGroups) {
            residentGroupJoinRequestRepository.findByGroupIdAndRequesterId(group.getId(), userId)
                    .ifPresent(request -> viewerRequestsByGroupId.put(group.getId(), request));
        }

        List<GroupResponse> response = new ArrayList<>();
        for (ResidentGroupEntity group : allGroups) {
            ResidentGroupJoinRequestEntity viewerRequest = viewerRequestsByGroupId.get(group.getId());
            response.add(new GroupResponse(
                    group.getId(),
                    group.getSlug(),
                    group.getName(),
                    group.getDescription(),
                    group.getVisibility().name(),
                    group.getOwner().getId(),
                    group.getOwner().getFullName(),
                    subscribedIds.contains(group.getId()),
                    viewerRequest != null && viewerRequest.getStatus() == JoinRequestStatus.PENDING,
                    viewerRequest != null ? viewerRequest.getStatus().name() : null,
                    group.getOwner().getId().equals(userId),
                    residentGroupJoinRequestRepository.countByGroupIdAndStatus(group.getId(), JoinRequestStatus.PENDING),
                    memberCountByGroupId.getOrDefault(group.getId(), 0L)
            ));
        }
        return response;
    }

    @Transactional
    public GroupResponse createGroup(AppUserPrincipal principal, CreateGroupRequest request) {
        UserEntity owner = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        ResidentGroupEntity group = new ResidentGroupEntity();
        group.setCommunity(communityAccessService.requireCommunityForPrincipal(principal));
        group.setName(request.name().trim());
        group.setDescription(trimToNull(request.description()));
        group.setVisibility(request.visibility());
        group.setSlug(generateUniqueSlug(request.name()));
        group.setOwner(owner);
        ResidentGroupEntity saved = residentGroupRepository.save(group);

        ResidentGroupMemberEntity ownerMembership = new ResidentGroupMemberEntity();
        ownerMembership.setGroup(saved);
        ownerMembership.setUser(owner);
        residentGroupMemberRepository.save(ownerMembership);

        log.info("Group created groupId={} slug={} ownerUserId={} visibility={}",
                saved.getId(), saved.getSlug(), owner.getId(), saved.getVisibility());
        return new GroupResponse(
                saved.getId(),
                saved.getSlug(),
                saved.getName(),
                saved.getDescription(),
                saved.getVisibility().name(),
                owner.getId(),
                owner.getFullName(),
                true,
                false,
                null,
                true,
                0,
                1
        );
    }

    @Transactional
    public GroupResponse subscribe(AppUserPrincipal principal, Long groupId) {
        Long communityId = communityAccessService.requireCommunityIdForPrincipal(principal);
        ResidentGroupEntity group = residentGroupRepository.findByIdAndCommunityId(groupId, communityId)
                .orElseThrow(() -> new NotFoundException("Group not found"));
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (residentGroupMemberRepository.existsByGroupIdAndUserId(groupId, user.getId())) {
            return toGroupResponse(group, user.getId());
        }

        if (group.getVisibility() == GroupVisibility.PRIVATE && !group.getOwner().getId().equals(user.getId())) {
            ResidentGroupJoinRequestEntity request = residentGroupJoinRequestRepository
                    .findByGroupIdAndRequesterId(groupId, user.getId())
                    .orElse(null);
            if (request != null && request.getStatus() == JoinRequestStatus.REJECTED) {
                log.info("Private group join request remains rejected groupId={} requesterUserId={}", groupId, user.getId());
                return toGroupResponse(group, user.getId());
            }
            if (request == null) {
                request = new ResidentGroupJoinRequestEntity();
                request.setGroup(group);
                request.setRequester(user);
            }
            request.setStatus(JoinRequestStatus.PENDING);
            request.setReviewedAt(null);
            residentGroupJoinRequestRepository.save(request);
            log.info("Private group join request created groupId={} requesterUserId={}", groupId, user.getId());
            return toGroupResponse(group, user.getId());
        }

        if (!residentGroupMemberRepository.existsByGroupIdAndUserId(groupId, user.getId())) {
            ResidentGroupMemberEntity membership = new ResidentGroupMemberEntity();
            membership.setGroup(group);
            membership.setUser(user);
            residentGroupMemberRepository.save(membership);
        }
        residentGroupJoinRequestRepository.findByGroupIdAndRequesterId(groupId, user.getId()).ifPresent(existing -> {
            existing.setStatus(JoinRequestStatus.APPROVED);
            existing.setReviewedAt(Instant.now());
            residentGroupJoinRequestRepository.save(existing);
        });
        return toGroupResponse(group, user.getId());
    }

    @Transactional
    public GroupResponse unsubscribe(AppUserPrincipal principal, Long groupId) {
        Long communityId = communityAccessService.requireCommunityIdForPrincipal(principal);
        ResidentGroupEntity group = residentGroupRepository.findByIdAndCommunityId(groupId, communityId)
                .orElseThrow(() -> new NotFoundException("Group not found"));
        if (group.getOwner().getId().equals(principal.getId())) {
            throw new IllegalArgumentException("Group owner cannot unsubscribe from own group");
        }
        residentGroupMemberRepository.deleteByGroupIdAndUserId(groupId, principal.getId());
        residentGroupJoinRequestRepository.findByGroupIdAndRequesterId(groupId, principal.getId()).ifPresent(existing -> {
            existing.setStatus(JoinRequestStatus.REJECTED);
            existing.setReviewedAt(Instant.now());
            residentGroupJoinRequestRepository.save(existing);
        });
        return toGroupResponse(group, principal.getId());
    }

    @Transactional(readOnly = true)
    public List<GroupJoinRequestResponse> listPendingRequests(AppUserPrincipal principal) {
        Long communityId = communityAccessService.requireCommunityIdForPrincipal(principal);
        return residentGroupJoinRequestRepository.findByGroupOwnerIdAndGroupCommunityIdAndStatusOrderByCreatedAtAsc(
                        principal.getId(),
                        communityId,
                        JoinRequestStatus.PENDING
                ).stream()
                .map(request -> new GroupJoinRequestResponse(
                        request.getId(),
                        request.getGroup().getId(),
                        request.getGroup().getName(),
                        request.getRequester().getId(),
                        request.getRequester().getFullName(),
                        request.getRequester().getEmail(),
                        request.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public GroupJoinRequestResponse approveRequest(AppUserPrincipal principal, Long requestId) {
        ResidentGroupJoinRequestEntity request = requireOwnerRequest(principal.getId(), requestId);
        if (!residentGroupMemberRepository.existsByGroupIdAndUserId(request.getGroup().getId(), request.getRequester().getId())) {
            ResidentGroupMemberEntity membership = new ResidentGroupMemberEntity();
            membership.setGroup(request.getGroup());
            membership.setUser(request.getRequester());
            residentGroupMemberRepository.save(membership);
        }
        request.setStatus(JoinRequestStatus.APPROVED);
        request.setReviewedAt(Instant.now());
        residentGroupJoinRequestRepository.save(request);
        return new GroupJoinRequestResponse(
                request.getId(),
                request.getGroup().getId(),
                request.getGroup().getName(),
                request.getRequester().getId(),
                request.getRequester().getFullName(),
                request.getRequester().getEmail(),
                request.getCreatedAt()
        );
    }

    @Transactional
    public GroupJoinRequestResponse rejectRequest(AppUserPrincipal principal, Long requestId) {
        ResidentGroupJoinRequestEntity request = requireOwnerRequest(principal.getId(), requestId);
        request.setStatus(JoinRequestStatus.REJECTED);
        request.setReviewedAt(Instant.now());
        residentGroupJoinRequestRepository.save(request);
        return new GroupJoinRequestResponse(
                request.getId(),
                request.getGroup().getId(),
                request.getGroup().getName(),
                request.getRequester().getId(),
                request.getRequester().getFullName(),
                request.getRequester().getEmail(),
                request.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<String> findAccessibleGroupSlugs(Long userId) {
        Long communityId = communityAccessService.requireCommunityIdForUser(userId);
        List<String> slugs = new ArrayList<>();
        residentGroupRepository.findByCommunityIdAndVisibilityOrderByNameAsc(communityId, GroupVisibility.PUBLIC)
                .forEach(group -> slugs.add(group.getSlug()));
        List<Long> memberGroupIds = residentGroupMemberRepository.findGroupIdsByUserIdAndCommunityId(userId, communityId);
        if (!memberGroupIds.isEmpty()) {
            residentGroupRepository.findByCommunityIdAndIdInOrderByNameAsc(communityId, memberGroupIds).forEach(group -> {
                if (!slugs.contains(group.getSlug())) {
                    slugs.add(group.getSlug());
                }
            });
        }
        return slugs;
    }

    @Transactional(readOnly = true)
    public ResidentGroupEntity requireAccessibleGroup(Long userId, String groupSlug) {
        ResidentGroupEntity group = residentGroupRepository.findBySlugAndCommunityId(
                        groupSlug,
                        communityAccessService.requireCommunityIdForUser(userId)
                )
                .orElseThrow(() -> new NotFoundException("Group not found"));
        if (group.getVisibility() == GroupVisibility.PUBLIC) {
            return group;
        }
        if (group.getOwner().getId().equals(userId)) {
            return group;
        }
        if (!residentGroupMemberRepository.existsByGroupIdAndUserId(group.getId(), userId)) {
            throw new IllegalArgumentException("Group is private");
        }
        return group;
    }

    private GroupResponse toGroupResponse(ResidentGroupEntity group, Long userId) {
        long count = residentGroupMemberRepository.countMembersByGroupIds(List.of(group.getId())).stream()
                .findFirst()
                .map(GroupMemberCountProjection::getTotalCount)
                .orElse(0L);
        boolean subscribed = residentGroupMemberRepository.existsByGroupIdAndUserId(group.getId(), userId);
        ResidentGroupJoinRequestEntity viewerRequest = residentGroupJoinRequestRepository.findByGroupIdAndRequesterId(group.getId(), userId)
                .orElse(null);
        boolean requestPending = viewerRequest != null && viewerRequest.getStatus() == JoinRequestStatus.PENDING;
        return new GroupResponse(
                group.getId(),
                group.getSlug(),
                group.getName(),
                group.getDescription(),
                group.getVisibility().name(),
                group.getOwner().getId(),
                group.getOwner().getFullName(),
                subscribed,
                requestPending,
                viewerRequest != null ? viewerRequest.getStatus().name() : null,
                group.getOwner().getId().equals(userId),
                residentGroupJoinRequestRepository.countByGroupIdAndStatus(group.getId(), JoinRequestStatus.PENDING),
                count
        );
    }

    private ResidentGroupJoinRequestEntity requireOwnerRequest(Long ownerUserId, Long requestId) {
        ResidentGroupJoinRequestEntity request = residentGroupJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Join request not found"));
        if (!request.getGroup().getOwner().getId().equals(ownerUserId)) {
            throw new IllegalArgumentException("Only the group owner can review requests");
        }
        return request;
    }

    private String generateUniqueSlug(String groupName) {
        String base = slugify(groupName);
        if (!residentGroupRepository.existsBySlug(base)) {
            return base;
        }
        int suffix = 2;
        while (residentGroupRepository.existsBySlug(base + "-" + suffix)) {
            suffix += 1;
        }
        return base + "-" + suffix;
    }

    private String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.isBlank() ? "group" : normalized;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
