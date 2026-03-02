package com.hoa.silverleaf.board;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BroadcastRepository extends JpaRepository<BroadcastEntity, Long> {
    List<BroadcastEntity> findAllByOrderByCreatedAtDescIdDesc();
}
