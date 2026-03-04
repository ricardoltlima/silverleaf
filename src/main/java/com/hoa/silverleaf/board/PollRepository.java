package com.hoa.silverleaf.board;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PollRepository extends JpaRepository<PollEntity, Long> {
    List<PollEntity> findByCommunityIdAndActiveTrueOrderByCreatedAtDescIdDesc(Long communityId);
    java.util.Optional<PollEntity> findByIdAndCommunityId(Long id, Long communityId);
}
