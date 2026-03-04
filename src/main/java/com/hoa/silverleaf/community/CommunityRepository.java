package com.hoa.silverleaf.community;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommunityRepository extends JpaRepository<CommunityEntity, Long> {
    Optional<CommunityEntity> findBySlug(String slug);
}
