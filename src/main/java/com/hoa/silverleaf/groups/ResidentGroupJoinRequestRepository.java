package com.hoa.silverleaf.groups;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResidentGroupJoinRequestRepository extends JpaRepository<ResidentGroupJoinRequestEntity, Long> {
    Optional<ResidentGroupJoinRequestEntity> findByGroupIdAndRequesterId(Long groupId, Long requesterId);
    List<ResidentGroupJoinRequestEntity> findByGroupOwnerIdAndStatusOrderByCreatedAtAsc(Long ownerId, JoinRequestStatus status);
    long countByGroupIdAndStatus(Long groupId, JoinRequestStatus status);
}

