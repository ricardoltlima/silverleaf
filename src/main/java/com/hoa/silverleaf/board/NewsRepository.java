package com.hoa.silverleaf.board;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NewsRepository extends JpaRepository<NewsEntity, Long> {
    List<NewsEntity> findAllByCommunityIdOrderByCreatedAtDescIdDesc(Long communityId);
    java.util.Optional<NewsEntity> findByIdAndCommunityId(Long id, Long communityId);
}
