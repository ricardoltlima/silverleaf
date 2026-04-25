package com.hoa.silverleaf.garagesales;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface GarageSaleItemRepository extends JpaRepository<GarageSaleItemEntity, Long> {
    List<GarageSaleItemEntity> findAllByCommunityIdOrderByCreatedAtDescIdDesc(Long communityId, Pageable pageable);

    @Query("""
            select i from GarageSaleItemEntity i
            where i.community.id = :communityId
              and (i.createdAt < :cursorCreatedAt
              or (i.createdAt = :cursorCreatedAt and i.id < :cursorId))
            order by i.createdAt desc, i.id desc
            """)
    List<GarageSaleItemEntity> findAllByCommunityIdAfterCursorOrderByCreatedAtDescIdDesc(
            @Param("communityId") Long communityId,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

    Optional<GarageSaleItemEntity> findByIdAndCommunityId(Long id, Long communityId);
}
