package com.hoa.silverleaf.board;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface NewsRepository extends JpaRepository<NewsEntity, Long> {
    List<NewsEntity> findAllByCommunityIdOrderByCreatedAtDescIdDesc(Long communityId, Pageable pageable);

    @Query("""
            select n from NewsEntity n
            where n.community.id = :communityId
              and (n.createdAt < :cursorCreatedAt
              or (n.createdAt = :cursorCreatedAt and n.id < :cursorId))
            order by n.createdAt desc, n.id desc
            """)
    List<NewsEntity> findAllByCommunityIdAfterCursorOrderByCreatedAtDescIdDesc(
            @Param("communityId") Long communityId,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

    java.util.Optional<NewsEntity> findByIdAndCommunityId(Long id, Long communityId);
}
