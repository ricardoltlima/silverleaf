package com.hoa.silverleaf.feed;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FeedPostLikeRepository extends JpaRepository<FeedPostLikeEntity, Long> {

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    Optional<FeedPostLikeEntity> findByPostIdAndUserId(Long postId, Long userId);

    List<FeedPostLikeEntity> findByPostIdInAndUserId(List<Long> postIds, Long userId);

    void deleteByPostIdAndUserId(Long postId, Long userId);
    void deleteByPostId(Long postId);

    @Query("""
            select l.post.id as postId, count(l) as totalCount
            from FeedPostLikeEntity l
            where l.post.id in :postIds
            group by l.post.id
            """)
    List<PostCountProjection> countByPostIds(@Param("postIds") List<Long> postIds);

    @Query("""
            select l.post.id as postId, l.reactionType as reactionType, count(l) as totalCount
            from FeedPostLikeEntity l
            where l.post.id in :postIds
            group by l.post.id, l.reactionType
            """)
    List<PostReactionCountProjection> countByPostIdsGroupedByReaction(@Param("postIds") List<Long> postIds);
}
