package com.hoa.silverleaf.groups;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResidentGroupRepository extends JpaRepository<ResidentGroupEntity, Long> {
    Optional<ResidentGroupEntity> findBySlugAndCommunityId(String slug, Long communityId);
    Optional<ResidentGroupEntity> findByIdAndCommunityId(Long id, Long communityId);
    boolean existsBySlug(String slug);
    List<ResidentGroupEntity> findAllByCommunityIdOrderByNameAsc(Long communityId);
    List<ResidentGroupEntity> findByCommunityIdAndVisibilityOrderByNameAsc(Long communityId, GroupVisibility visibility);
    List<ResidentGroupEntity> findByCommunityIdAndIdInOrderByNameAsc(Long communityId, List<Long> ids);
}
