package com.hoa.silverleaf.board;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ViolationReportRepository extends JpaRepository<ViolationReportEntity, Long> {
    List<ViolationReportEntity> findAllByCommunityIdOrderByCreatedAtDescIdDesc(Long communityId);
    List<ViolationReportEntity> findByCommunityIdAndReporterIdOrderByCreatedAtDescIdDesc(Long communityId, Long reporterId);
    java.util.Optional<ViolationReportEntity> findByIdAndCommunityId(Long id, Long communityId);
}
