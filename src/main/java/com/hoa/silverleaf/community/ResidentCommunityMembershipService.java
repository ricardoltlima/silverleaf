package com.hoa.silverleaf.community;

import com.hoa.silverleaf.users.UserEntity;
import com.hoa.silverleaf.users.UserRole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ResidentCommunityMembershipService {

    private final ResidentCommunityMembershipRepository residentCommunityMembershipRepository;
    private final CommunityService communityService;

    public ResidentCommunityMembershipService(
            ResidentCommunityMembershipRepository residentCommunityMembershipRepository,
            CommunityService communityService
    ) {
        this.residentCommunityMembershipRepository = residentCommunityMembershipRepository;
        this.communityService = communityService;
    }

    @Transactional
    public void ensureDefaultMembership(UserEntity resident) {
        communityService.findFirstActiveCommunity()
                .ifPresent(community -> activateMembership(resident, community));
    }

    @Transactional(readOnly = true)
    public boolean hasActiveMembership(Long residentId) {
        return residentCommunityMembershipRepository.findFirstByResidentIdAndActiveTrueOrderByUpdatedAtDescIdDesc(residentId).isPresent();
    }

    @Transactional
    public void activateMembership(UserEntity resident, CommunityEntity community) {
        ResidentCommunityMembershipEntity membership = residentCommunityMembershipRepository
                .findByResidentIdAndCommunityId(resident.getId(), community.getId())
                .orElseGet(() -> {
                    ResidentCommunityMembershipEntity created = new ResidentCommunityMembershipEntity();
                    created.setResident(resident);
                    created.setCommunity(community);
                    created.setJoinedAt(Instant.now());
                    return created;
                });
        membership.setActive(true);
        membership.setCommunityAdmin(resident.getRole() == UserRole.HOA_ADMIN || resident.getRole() == UserRole.ADMIN);
        membership.setLeftAt(null);
        if (membership.getJoinedAt() == null) {
            membership.setJoinedAt(Instant.now());
        }
        residentCommunityMembershipRepository.save(membership);
    }

    @Transactional
    public void syncCommunityAdmin(UserEntity resident, CommunityEntity community, boolean communityAdmin) {
        ResidentCommunityMembershipEntity membership = residentCommunityMembershipRepository
                .findByResidentIdAndCommunityId(resident.getId(), community.getId())
                .orElseGet(() -> {
                    ResidentCommunityMembershipEntity created = new ResidentCommunityMembershipEntity();
                    created.setResident(resident);
                    created.setCommunity(community);
                    created.setJoinedAt(Instant.now());
                    created.setActive(true);
                    return created;
                });
        membership.setCommunityAdmin(communityAdmin);
        if (membership.getJoinedAt() == null) {
            membership.setJoinedAt(Instant.now());
        }
        residentCommunityMembershipRepository.save(membership);
    }
}
