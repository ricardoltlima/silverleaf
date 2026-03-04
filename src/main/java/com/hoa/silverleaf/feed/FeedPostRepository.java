package com.hoa.silverleaf.feed;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface FeedPostRepository extends JpaRepository<FeedPostEntity, Long> {

    Optional<FeedPostEntity> findByIdAndCommunityId(Long id, Long communityId);
    boolean existsByIdAndCommunityId(Long id, Long communityId);

    List<FeedPostEntity> findByCommunityIdAndChannelOrderByCreatedAtDescIdDesc(
            Long communityId,
            FeedChannel channel,
            Pageable pageable
    );
    List<FeedPostEntity> findByCommunityIdAndChannelAndGroupSlugOrderByCreatedAtDescIdDesc(
            Long communityId,
            FeedChannel channel,
            String groupSlug,
            Pageable pageable
    );
    List<FeedPostEntity> findByCommunityIdAndChannelAndGroupSlugInOrderByCreatedAtDescIdDesc(
            Long communityId,
            FeedChannel channel,
            List<String> groupSlugs,
            Pageable pageable
    );

    @Query("""
            select p from FeedPostEntity p
            where p.community.id = :communityId
                and p.channel = :channel
                and (p.createdAt < :cursorCreatedAt
                or (p.createdAt = :cursorCreatedAt and p.id < :cursorId))
            order by p.createdAt desc, p.id desc
            """)
    List<FeedPostEntity> findFeedAfterCursor(
            @Param("communityId") Long communityId,
            @Param("channel") FeedChannel channel,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

    @Query("""
            select p from FeedPostEntity p
            where p.community.id = :communityId
                and p.channel = :channel
                and p.groupSlug = :groupSlug
                and (p.createdAt < :cursorCreatedAt
                or (p.createdAt = :cursorCreatedAt and p.id < :cursorId))
            order by p.createdAt desc, p.id desc
            """)
    List<FeedPostEntity> findFeedAfterCursorForGroup(
            @Param("communityId") Long communityId,
            @Param("channel") FeedChannel channel,
            @Param("groupSlug") String groupSlug,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

    @Query("""
            select p from FeedPostEntity p
            where p.community.id = :communityId
                and p.channel = :channel
                and p.groupSlug in :groupSlugs
                and (p.createdAt < :cursorCreatedAt
                or (p.createdAt = :cursorCreatedAt and p.id < :cursorId))
            order by p.createdAt desc, p.id desc
            """)
    List<FeedPostEntity> findFeedAfterCursorForGroupSlugs(
            @Param("communityId") Long communityId,
            @Param("channel") FeedChannel channel,
            @Param("groupSlugs") List<String> groupSlugs,
            @Param("cursorCreatedAt") Instant cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );
}
