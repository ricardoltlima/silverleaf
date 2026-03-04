package com.hoa.silverleaf.groups;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ResidentGroupMemberRepository extends JpaRepository<ResidentGroupMemberEntity, Long> {
    Optional<ResidentGroupMemberEntity> findByGroupIdAndUserId(Long groupId, Long userId);
    boolean existsByGroupIdAndUserId(Long groupId, Long userId);
    void deleteByGroupIdAndUserId(Long groupId, Long userId);

    @Query("""
            select m.group.id from ResidentGroupMemberEntity m
            where m.user.id = :userId and m.group.community.id = :communityId
            """)
    List<Long> findGroupIdsByUserIdAndCommunityId(@Param("userId") Long userId, @Param("communityId") Long communityId);

    @Query("""
            select m.group.id as groupId, count(m.id) as totalCount
            from ResidentGroupMemberEntity m
            where m.group.id in :groupIds
            group by m.group.id
            """)
    List<GroupMemberCountProjection> countMembersByGroupIds(@Param("groupIds") List<Long> groupIds);
}
