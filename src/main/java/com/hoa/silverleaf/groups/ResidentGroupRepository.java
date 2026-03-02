package com.hoa.silverleaf.groups;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResidentGroupRepository extends JpaRepository<ResidentGroupEntity, Long> {
    Optional<ResidentGroupEntity> findBySlug(String slug);
    boolean existsBySlug(String slug);
    List<ResidentGroupEntity> findAllByOrderByNameAsc();
    List<ResidentGroupEntity> findByVisibilityOrderByNameAsc(GroupVisibility visibility);
    List<ResidentGroupEntity> findByIdInOrderByNameAsc(List<Long> ids);
}
