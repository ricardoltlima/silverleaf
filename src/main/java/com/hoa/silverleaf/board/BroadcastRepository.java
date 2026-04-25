package com.hoa.silverleaf.board;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface BroadcastRepository extends JpaRepository<BroadcastEntity, Long> {
    List<BroadcastEntity> findAllByCommunityIdOrderByCreatedAtDescIdDesc(Long communityId, Pageable pageable);

    @Query("""
            select b from BroadcastEntity b
            where b.community.id = :communityId
              and (b.createdAt < :cursorCreatedAt
              or (b.createdAt = :cursorCreatedAt and b.id < :cursorId))
            order by b.createdAt desc, b.id desc
            """)
    List<BroadcastEntity> findAllByCommunityIdAfterCursorOrderByCreatedAtDescIdDesc(
            @Param("communityId") Long communityId,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );
}
