package com.hoa.silverleaf.garagesales;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GarageSaleItemRepository extends JpaRepository<GarageSaleItemEntity, Long> {
    List<GarageSaleItemEntity> findAllByCommunityIdOrderByCreatedAtDescIdDesc(Long communityId);

    Optional<GarageSaleItemEntity> findByIdAndCommunityId(Long id, Long communityId);
}
