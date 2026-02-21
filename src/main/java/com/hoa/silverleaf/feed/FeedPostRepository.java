package com.hoa.silverleaf.feed;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface FeedPostRepository extends JpaRepository<FeedPostEntity, Long> {

    List<FeedPostEntity> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);

    @Query("""
            select p from FeedPostEntity p
            where p.createdAt < :cursorCreatedAt
                or (p.createdAt = :cursorCreatedAt and p.id < :cursorId)
            order by p.createdAt desc, p.id desc
            """)
    List<FeedPostEntity> findFeedAfterCursor(
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );
}
