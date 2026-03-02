package com.hoa.silverleaf.board;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PollRepository extends JpaRepository<PollEntity, Long> {
    List<PollEntity> findByActiveTrueOrderByCreatedAtDescIdDesc();
}
