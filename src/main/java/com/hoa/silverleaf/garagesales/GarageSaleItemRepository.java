package com.hoa.silverleaf.garagesales;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GarageSaleItemRepository extends JpaRepository<GarageSaleItemEntity, Long> {
    List<GarageSaleItemEntity> findAllByCommunityIdOrderByCreatedAtDescIdDesc(Long communityId);
}
