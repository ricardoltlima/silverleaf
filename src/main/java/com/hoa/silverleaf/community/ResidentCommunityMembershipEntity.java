package com.hoa.silverleaf.community;

import com.hoa.silverleaf.users.UserEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "resident_community_membership")
public class ResidentCommunityMembershipEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resident_id", nullable = false)
    private UserEntity resident;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "community_id", nullable = false)
    private CommunityEntity community;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "community_admin", nullable = false)
    private boolean communityAdmin;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public UserEntity getResident() {
        return resident;
    }

    public void setResident(UserEntity resident) {
        this.resident = resident;
    }

    public CommunityEntity getCommunity() {
        return community;
    }

    public void setCommunity(CommunityEntity community) {
        this.community = community;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isCommunityAdmin() {
        return communityAdmin;
    }

    public void setCommunityAdmin(boolean communityAdmin) {
        this.communityAdmin = communityAdmin;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }

    public Instant getLeftAt() {
        return leftAt;
    }

    public void setLeftAt(Instant leftAt) {
        this.leftAt = leftAt;
    }
}
