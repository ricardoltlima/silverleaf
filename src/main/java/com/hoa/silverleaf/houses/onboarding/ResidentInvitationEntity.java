package com.hoa.silverleaf.houses.onboarding;

import com.hoa.silverleaf.houses.HouseEntity;
import com.hoa.silverleaf.users.UserEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "resident_invitation")
public class ResidentInvitationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resident_id", nullable = false)
    private UserEntity resident;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "house_id", nullable = false)
    private HouseEntity house;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invited_by_user_id", nullable = false)
    private UserEntity invitedBy;

    @Column(name = "invitation_token", nullable = false, unique = true, length = 64)
    private String invitationToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ResidentInvitationStatus status = ResidentInvitationStatus.PENDING;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getId() { return id; }
    public UserEntity getResident() { return resident; }
    public void setResident(UserEntity resident) { this.resident = resident; }
    public HouseEntity getHouse() { return house; }
    public void setHouse(HouseEntity house) { this.house = house; }
    public UserEntity getInvitedBy() { return invitedBy; }
    public void setInvitedBy(UserEntity invitedBy) { this.invitedBy = invitedBy; }
    public String getInvitationToken() { return invitationToken; }
    public void setInvitationToken(String invitationToken) { this.invitationToken = invitationToken; }
    public ResidentInvitationStatus getStatus() { return status; }
    public void setStatus(ResidentInvitationStatus status) { this.status = status; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
