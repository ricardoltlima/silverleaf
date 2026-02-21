package com.hoa.silverleaf.users;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    Page<UserEntity> findByRole(UserRole role, Pageable pageable);

    @Query("""
            select u from UserEntity u
            where u.role = :role
              and (
                lower(u.fullName) like lower(concat('%', :q, '%'))
                or lower(u.email) like lower(concat('%', :q, '%'))
              )
            """)
    Page<UserEntity> searchByRoleAndQuery(
            @Param("role") UserRole role,
            @Param("q") String q,
            Pageable pageable
    );
}
