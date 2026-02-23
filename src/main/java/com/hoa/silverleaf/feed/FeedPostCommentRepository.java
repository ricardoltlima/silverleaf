package com.hoa.silverleaf.feed;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FeedPostCommentRepository extends JpaRepository<FeedPostCommentEntity, Long> {

    List<FeedPostCommentEntity> findByPostIdInOrderByCreatedAtAscIdAsc(List<Long> postIds);

    @Query("""
            select c.post.id as postId, count(c) as totalCount
            from FeedPostCommentEntity c
            where c.post.id in :postIds
            group by c.post.id
            """)
    List<PostCountProjection> countByPostIds(@Param("postIds") List<Long> postIds);
}
