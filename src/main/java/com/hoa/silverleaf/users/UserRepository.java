package com.hoa.silverleaf.users;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.util.Collection;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    Page<UserEntity> findByRole(UserRole role, Pageable pageable);
    Page<UserEntity> findByRoleIn(Collection<UserRole> roles, Pageable pageable);
    Page<UserEntity> findByIdInAndRoleIn(Collection<Long> ids, Collection<UserRole> roles, Pageable pageable);

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

    @Query("""
            select u from UserEntity u
            where u.role in :roles
              and (
                lower(u.fullName) like lower(concat('%', :q, '%'))
                or lower(u.email) like lower(concat('%', :q, '%'))
              )
            """)
    Page<UserEntity> searchByRoleInAndQuery(
            @Param("roles") Collection<UserRole> roles,
            @Param("q") String q,
            Pageable pageable
    );

    @Query("""
            select u from UserEntity u
            where u.id in :ids
              and u.role in :roles
              and (
                lower(u.fullName) like lower(concat('%', :q, '%'))
                or lower(u.email) like lower(concat('%', :q, '%'))
              )
            """)
    Page<UserEntity> searchByIdInAndRoleInAndQuery(
            @Param("ids") Collection<Long> ids,
            @Param("roles") Collection<UserRole> roles,
            @Param("q") String q,
            Pageable pageable
    );

    List<UserEntity> findByRoleAndEnabledTrueOrderByFullNameAsc(UserRole role);

    List<UserEntity> findByRoleInAndEnabledTrueOrderByFullNameAsc(Collection<UserRole> roles);
    List<UserEntity> findByIdInAndRoleInAndEnabledTrueOrderByFullNameAsc(Collection<Long> ids, Collection<UserRole> roles);
}
