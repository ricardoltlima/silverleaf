package com.hoa.silverleaf.feed;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeedPostReportRepository extends JpaRepository<FeedPostReportEntity, Long> {
    Optional<FeedPostReportEntity> findByPostIdAndReporterId(Long postId, Long reporterId);
    List<FeedPostReportEntity> findAllByCommunityIdOrderByCreatedAtDescIdDesc(Long communityId);
    boolean existsByCommunityIdAndPostId(Long communityId, Long postId);
    void deleteByPostId(Long postId);
}
