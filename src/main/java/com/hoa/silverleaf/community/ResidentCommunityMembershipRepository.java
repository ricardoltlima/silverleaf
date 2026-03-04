package com.hoa.silverleaf.community;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ResidentCommunityMembershipRepository extends JpaRepository<ResidentCommunityMembershipEntity, Long> {
    Optional<ResidentCommunityMembershipEntity> findFirstByResidentIdAndActiveTrueOrderByUpdatedAtDescIdDesc(Long residentId);
    Optional<ResidentCommunityMembershipEntity> findByResidentIdAndCommunityId(Long residentId, Long communityId);
    boolean existsByResidentIdAndCommunityIdAndActiveTrue(Long residentId, Long communityId);
    boolean existsByResidentIdAndCommunityIdAndActiveTrueAndCommunityAdminTrue(Long residentId, Long communityId);
    List<ResidentCommunityMembershipEntity> findByResidentIdAndActiveTrue(Long residentId);
    List<ResidentCommunityMembershipEntity> findByResidentIdOrderByActiveDescUpdatedAtDescIdDesc(Long residentId);

    @Query("""
            select rcm.resident.id from ResidentCommunityMembershipEntity rcm
            where rcm.community.id = :communityId and rcm.active = true
            order by rcm.resident.id asc
            """)
    List<Long> findActiveResidentIdsByCommunityId(@Param("communityId") Long communityId);
}
