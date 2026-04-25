package com.hoa.silverleaf.board;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ViolationReportRepository extends JpaRepository<ViolationReportEntity, Long> {
    List<ViolationReportEntity> findAllByCommunityIdOrderByCreatedAtDescIdDesc(Long communityId, Pageable pageable);

    @Query("""
            select v from ViolationReportEntity v
            where v.community.id = :communityId
              and (v.createdAt < :cursorCreatedAt
              or (v.createdAt = :cursorCreatedAt and v.id < :cursorId))
            order by v.createdAt desc, v.id desc
            """)
    List<ViolationReportEntity> findAllByCommunityIdAfterCursorOrderByCreatedAtDescIdDesc(
            @Param("communityId") Long communityId,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

    List<ViolationReportEntity> findByCommunityIdAndReporterIdOrderByCreatedAtDescIdDesc(Long communityId, Long reporterId);
    java.util.Optional<ViolationReportEntity> findByIdAndCommunityId(Long id, Long communityId);
}
