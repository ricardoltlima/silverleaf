package com.hoa.silverleaf.security;

import com.hoa.silverleaf.users.UserEntity;
import com.hoa.silverleaf.users.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class AppUserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String fullName;
    private final String passwordHash;
    private final UserRole role;
    private final boolean enabled;
    private final Long activeCommunityId;
    private final String activeCommunitySlug;
    private final String activeCommunityName;

    public AppUserPrincipal(UserEntity user) {
        this(user, null, null, null);
    }

    public AppUserPrincipal(UserEntity user, Long activeCommunityId, String activeCommunitySlug, String activeCommunityName) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.passwordHash = user.getPasswordHash();
        this.role = user.getRole();
        this.enabled = user.isEnabled();
        this.activeCommunityId = activeCommunityId;
        this.activeCommunitySlug = activeCommunitySlug;
        this.activeCommunityName = activeCommunityName;
    }

    public AppUserPrincipal(
            AppUserPrincipal principal,
            Long activeCommunityId,
            String activeCommunitySlug,
            String activeCommunityName
    ) {
        this.id = principal.id;
        this.email = principal.email;
        this.fullName = principal.fullName;
        this.passwordHash = principal.passwordHash;
        this.role = principal.role;
        this.enabled = principal.enabled;
        this.activeCommunityId = activeCommunityId;
        this.activeCommunitySlug = activeCommunitySlug;
        this.activeCommunityName = activeCommunityName;
    }

    public Long getId() {
        return id;
    }

    public UserRole getRole() {
        return role;
    }

    public String getFullName() {
        return fullName;
    }

    public Long getActiveCommunityId() {
        return activeCommunityId;
    }

    public String getActiveCommunitySlug() {
        return activeCommunitySlug;
    }

    public String getActiveCommunityName() {
        return activeCommunityName;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
