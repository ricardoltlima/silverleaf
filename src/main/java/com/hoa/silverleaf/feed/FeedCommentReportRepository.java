package com.hoa.silverleaf.feed;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeedCommentReportRepository extends JpaRepository<FeedCommentReportEntity, Long> {
    Optional<FeedCommentReportEntity> findByCommentIdAndReporterId(Long commentId, Long reporterId);
    List<FeedCommentReportEntity> findAllByCommunityIdOrderByCreatedAtDescIdDesc(Long communityId);
    boolean existsByCommunityIdAndCommentId(Long communityId, Long commentId);
    void deleteByCommentId(Long commentId);
    void deleteByCommentIdIn(List<Long> commentIds);
}
