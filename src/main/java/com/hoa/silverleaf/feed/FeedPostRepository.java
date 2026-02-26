package com.hoa.silverleaf.feed;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface FeedPostRepository extends JpaRepository<FeedPostEntity, Long> {

    List<FeedPostEntity> findByChannelOrderByCreatedAtDescIdDesc(FeedChannel channel, Pageable pageable);
    List<FeedPostEntity> findByChannelAndGroupSlugOrderByCreatedAtDescIdDesc(
            FeedChannel channel,
            String groupSlug,
            Pageable pageable
    );
    List<FeedPostEntity> findByChannelAndGroupSlugInOrderByCreatedAtDescIdDesc(
            FeedChannel channel,
            List<String> groupSlugs,
            Pageable pageable
    );

    @Query("""
            select p from FeedPostEntity p
            where p.channel = :channel
                and (p.createdAt < :cursorCreatedAt
                or (p.createdAt = :cursorCreatedAt and p.id < :cursorId))
            order by p.createdAt desc, p.id desc
            """)
    List<FeedPostEntity> findFeedAfterCursor(
            @Param("channel") FeedChannel channel,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

    @Query("""
            select p from FeedPostEntity p
            where p.channel = :channel
                and p.groupSlug = :groupSlug
                and (p.createdAt < :cursorCreatedAt
                or (p.createdAt = :cursorCreatedAt and p.id < :cursorId))
            order by p.createdAt desc, p.id desc
            """)
    List<FeedPostEntity> findFeedAfterCursorForGroup(
            @Param("channel") FeedChannel channel,
            @Param("groupSlug") String groupSlug,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

    @Query("""
            select p from FeedPostEntity p
            where p.channel = :channel
                and p.groupSlug in :groupSlugs
                and (p.createdAt < :cursorCreatedAt
                or (p.createdAt = :cursorCreatedAt and p.id < :cursorId))
            order by p.createdAt desc, p.id desc
            """)
    List<FeedPostEntity> findFeedAfterCursorForGroupSlugs(
            @Param("channel") FeedChannel channel,
            @Param("groupSlugs") List<String> groupSlugs,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );
}
