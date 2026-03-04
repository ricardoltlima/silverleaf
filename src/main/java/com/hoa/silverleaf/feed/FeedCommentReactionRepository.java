package com.hoa.silverleaf.feed;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FeedCommentReactionRepository extends JpaRepository<FeedCommentReactionEntity, Long> {

    Optional<FeedCommentReactionEntity> findByCommentIdAndUserId(Long commentId, Long userId);

    List<FeedCommentReactionEntity> findByCommentIdInAndUserId(List<Long> commentIds, Long userId);

    void deleteByCommentIdAndUserId(Long commentId, Long userId);
    void deleteByCommentId(Long commentId);
    void deleteByCommentIdIn(List<Long> commentIds);

    @Query("""
            select r.comment.id as commentId, r.reactionType as reactionType, count(r) as totalCount
            from FeedCommentReactionEntity r
            where r.comment.id in :commentIds
            group by r.comment.id, r.reactionType
            """)
    List<CommentReactionCountProjection> countByCommentIdsGroupedByReaction(@Param("commentIds") List<Long> commentIds);
}
