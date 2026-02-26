package com.hoa.silverleaf.groups;

import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.groups.dto.CreateGroupRequest;
import com.hoa.silverleaf.groups.dto.GroupResponse;
import com.hoa.silverleaf.security.AppUserPrincipal;
import com.hoa.silverleaf.users.UserEntity;
import com.hoa.silverleaf.users.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final UserRepository userRepository;

    public GroupService(
            ResidentGroupRepository residentGroupRepository,
            ResidentGroupMemberRepository residentGroupMemberRepository,
            UserRepository userRepository
    ) {
        this.residentGroupRepository = residentGroupRepository;
        this.residentGroupMemberRepository = residentGroupMemberRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> listGroupsForUser(AppUserPrincipal principal) {
        Long userId = principal.getId();
        List<ResidentGroupEntity> publicGroups = residentGroupRepository.findByVisibilityOrderByNameAsc(GroupVisibility.PUBLIC);
        List<Long> memberGroupIds = residentGroupMemberRepository.findGroupIdsByUserId(userId);
        List<ResidentGroupEntity> memberGroups = memberGroupIds.isEmpty()
                ? List.of()
                : residentGroupRepository.findByIdInOrderByNameAsc(memberGroupIds);

        Set<ResidentGroupEntity> visibleGroups = new LinkedHashSet<>(publicGroups);
        visibleGroups.addAll(memberGroups);
        List<Long> visibleGroupIds = visibleGroups.stream().map(ResidentGroupEntity::getId).toList();
        Map<Long, Long> memberCountByGroupId = new HashMap<>();
        if (!visibleGroupIds.isEmpty()) {
            residentGroupMemberRepository.countMembersByGroupIds(visibleGroupIds)
                    .forEach(row -> memberCountByGroupId.put(row.getGroupId(), row.getTotalCount()));
        }
        Set<Long> subscribedIds = new LinkedHashSet<>(memberGroupIds);

        List<GroupResponse> response = new ArrayList<>();
        for (ResidentGroupEntity group : visibleGroups) {
            response.add(new GroupResponse(
                    group.getId(),
                    group.getSlug(),
                    group.getName(),
                    group.getDescription(),
                    group.getVisibility().name(),
                    group.getOwner().getId(),
                    group.getOwner().getFullName(),
                    subscribedIds.contains(group.getId()),
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
        group.setName(request.name().trim());
        group.setDescription(trimToNull(request.description()));
        group.setVisibility(parseVisibility(request.visibility()));
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
                1
        );
    }

    @Transactional
    public GroupResponse subscribe(AppUserPrincipal principal, Long groupId) {
        ResidentGroupEntity group = residentGroupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Group not found"));
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!residentGroupMemberRepository.existsByGroupIdAndUserId(groupId, user.getId())) {
            ResidentGroupMemberEntity membership = new ResidentGroupMemberEntity();
            membership.setGroup(group);
            membership.setUser(user);
            residentGroupMemberRepository.save(membership);
        }
        return toGroupResponse(group, true);
    }

    @Transactional
    public GroupResponse unsubscribe(AppUserPrincipal principal, Long groupId) {
        ResidentGroupEntity group = residentGroupRepository.findById(groupId)
                .orElseThrow(() -> new NotFoundException("Group not found"));
        if (group.getOwner().getId().equals(principal.getId())) {
            throw new IllegalArgumentException("Group owner cannot unsubscribe from own group");
        }
        residentGroupMemberRepository.deleteByGroupIdAndUserId(groupId, principal.getId());
        return toGroupResponse(group, false);
    }

    @Transactional(readOnly = true)
    public List<String> findAccessibleGroupSlugs(Long userId) {
        List<String> slugs = new ArrayList<>();
        residentGroupRepository.findByVisibilityOrderByNameAsc(GroupVisibility.PUBLIC)
                .forEach(group -> slugs.add(group.getSlug()));
        List<Long> memberGroupIds = residentGroupMemberRepository.findGroupIdsByUserId(userId);
        if (!memberGroupIds.isEmpty()) {
            residentGroupRepository.findByIdInOrderByNameAsc(memberGroupIds).forEach(group -> {
                if (!slugs.contains(group.getSlug())) {
                    slugs.add(group.getSlug());
                }
            });
        }
        return slugs;
    }

    @Transactional(readOnly = true)
    public ResidentGroupEntity requireAccessibleGroup(Long userId, String groupSlug) {
        ResidentGroupEntity group = residentGroupRepository.findBySlug(groupSlug)
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

    private GroupResponse toGroupResponse(ResidentGroupEntity group, boolean subscribed) {
        long count = residentGroupMemberRepository.countMembersByGroupIds(List.of(group.getId())).stream()
                .findFirst()
                .map(GroupMemberCountProjection::getTotalCount)
                .orElse(0L);
        return new GroupResponse(
                group.getId(),
                group.getSlug(),
                group.getName(),
                group.getDescription(),
                group.getVisibility().name(),
                group.getOwner().getId(),
                group.getOwner().getFullName(),
                subscribed,
                count
        );
    }

    private GroupVisibility parseVisibility(String rawVisibility) {
        try {
            return GroupVisibility.valueOf(rawVisibility.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid group visibility");
        }
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
