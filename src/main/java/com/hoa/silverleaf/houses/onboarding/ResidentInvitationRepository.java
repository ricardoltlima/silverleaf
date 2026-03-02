package com.hoa.silverleaf.houses.onboarding;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResidentInvitationRepository extends JpaRepository<ResidentInvitationEntity, Long> {
    Optional<ResidentInvitationEntity> findByInvitationToken(String invitationToken);
    boolean existsByInvitationToken(String invitationToken);
}
