package com.hoa.silverleaf.community;

import com.hoa.silverleaf.houses.HouseEntity;
import com.hoa.silverleaf.houses.HouseResidentRepository;
import com.hoa.silverleaf.security.AppUserPrincipal;
import com.hoa.silverleaf.users.UserRole;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommunityAccessService {

    private final HouseResidentRepository houseResidentRepository;
    private final CommunityService communityService;
    private final ResidentCommunityMembershipRepository residentCommunityMembershipRepository;
    private final CommunityRepository communityRepository;

    public CommunityAccessService(
            HouseResidentRepository houseResidentRepository,
            CommunityService communityService,
            ResidentCommunityMembershipRepository residentCommunityMembershipRepository,
            CommunityRepository communityRepository
    ) {
        this.houseResidentRepository = houseResidentRepository;
        this.communityService = communityService;
        this.residentCommunityMembershipRepository = residentCommunityMembershipRepository;
        this.communityRepository = communityRepository;
    }

    @Transactional(readOnly = true)
    public CommunityEntity requireCommunityForUser(Long userId) {
        return residentCommunityMembershipRepository.findFirstByResidentIdAndActiveTrueOrderByUpdatedAtDescIdDesc(userId)
                .map(ResidentCommunityMembershipEntity::getCommunity)
                .or(() -> houseResidentRepository.findFirstActiveByResidentIdOrderByMovedInAtDescIdDesc(userId)
                .map(membership -> membership.getHouse().getCommunity())
                )
                .orElseGet(communityService::requireDefaultCommunity);
    }

    @Transactional(readOnly = true)
    public Long requireCommunityIdForUser(Long userId) {
        return requireCommunityForUser(userId).getId();
    }

    @Transactional(readOnly = true)
    public CommunityEntity requireCommunityForPrincipal(AppUserPrincipal principal) {
        if (principal.getActiveCommunityId() != null) {
            return communityRepository.findById(principal.getActiveCommunityId())
                    .orElseGet(() -> requireCommunityForUser(principal.getId()));
        }
        return requireCommunityForUser(principal.getId());
    }

    @Transactional(readOnly = true)
    public Long requireCommunityIdForPrincipal(AppUserPrincipal principal) {
        return requireCommunityForPrincipal(principal).getId();
    }

    @Transactional(readOnly = true)
    public void requireUsersInSameCommunity(Long userId, Long otherUserId) {
        Long communityId = requireCommunityIdForUser(userId);
        if (!communityId.equals(requireCommunityIdForUser(otherUserId))) {
            throw new IllegalArgumentException("Resident does not belong to your community");
        }
    }

    @Transactional(readOnly = true)
    public void requireHouseInUserCommunity(Long userId, HouseEntity house) {
        Long communityId = requireCommunityIdForUser(userId);
        if (!house.getCommunity().getId().equals(communityId)) {
            throw new IllegalArgumentException("House does not belong to your community");
        }
    }

    @Transactional(readOnly = true)
    public void requireUsersInSameCommunity(AppUserPrincipal principal, Long otherUserId) {
        Long communityId = requireCommunityIdForPrincipal(principal);
        if (!communityId.equals(requireCommunityIdForUser(otherUserId))) {
            throw new IllegalArgumentException("Resident does not belong to your community");
        }
    }

    @Transactional(readOnly = true)
    public boolean isCurrentCommunityAdmin(AppUserPrincipal principal) {
        if (principal == null) {
            return false;
        }
        if (principal.getRole() == UserRole.ADMIN) {
            return true;
        }
        Long communityId = requireCommunityIdForPrincipal(principal);
        return residentCommunityMembershipRepository.existsByResidentIdAndCommunityIdAndActiveTrueAndCommunityAdminTrue(
                principal.getId(),
                communityId
        );
    }

    @Transactional(readOnly = true)
    public void requireCurrentCommunityAdmin(AppUserPrincipal principal) {
        if (!isCurrentCommunityAdmin(principal)) {
            throw new AccessDeniedException("Community admin access is required");
        }
    }
}
