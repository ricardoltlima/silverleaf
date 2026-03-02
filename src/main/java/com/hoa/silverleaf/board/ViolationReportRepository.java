package com.hoa.silverleaf.board;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ViolationReportRepository extends JpaRepository<ViolationReportEntity, Long> {
    List<ViolationReportEntity> findAllByOrderByCreatedAtDescIdDesc();
    List<ViolationReportEntity> findByReporterIdOrderByCreatedAtDescIdDesc(Long reporterId);
}
