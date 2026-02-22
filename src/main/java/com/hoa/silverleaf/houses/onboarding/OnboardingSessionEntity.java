package com.hoa.silverleaf.houses.onboarding;

import com.hoa.silverleaf.houses.HouseEntity;
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
@Table(name = "onboarding_session")
public class OnboardingSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_token", nullable = false, unique = true, length = 64)
    private String sessionToken;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "house_id", nullable = false)
    private HouseEntity house;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OnboardingStatus status = OnboardingStatus.STARTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "contact_type", length = 10)
    private ContactType contactType;

    @Column(name = "contact_value", length = 320)
    private String contactValue;

    @Column(name = "verification_token", unique = true, length = 64)
    private String verificationToken;

    @Column(name = "verification_expires_at")
    private Instant verificationExpiresAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "auth_provider", length = 30)
    private String authProvider;

    @Column(name = "auth_subject", length = 255)
    private String authSubject;

    @Column(name = "pending_provider", length = 30)
    private String pendingProvider;

    @Column(name = "pending_subject", length = 255)
    private String pendingSubject;

    @Column(name = "pending_full_name", length = 120)
    private String pendingFullName;

    @Column(name = "pending_email", length = 320)
    private String pendingEmail;

    @Column(name = "completed_at")
    private Instant completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public String getSessionToken() {
        return sessionToken;
    }

    public void setSessionToken(String sessionToken) {
        this.sessionToken = sessionToken;
    }

    public HouseEntity getHouse() {
        return house;
    }

    public void setHouse(HouseEntity house) {
        this.house = house;
    }

    public OnboardingStatus getStatus() {
        return status;
    }

    public void setStatus(OnboardingStatus status) {
        this.status = status;
    }

    public ContactType getContactType() {
        return contactType;
    }

    public void setContactType(ContactType contactType) {
        this.contactType = contactType;
    }

    public String getContactValue() {
        return contactValue;
    }

    public void setContactValue(String contactValue) {
        this.contactValue = contactValue;
    }

    public String getVerificationToken() {
        return verificationToken;
    }

    public void setVerificationToken(String verificationToken) {
        this.verificationToken = verificationToken;
    }

    public Instant getVerificationExpiresAt() {
        return verificationExpiresAt;
    }

    public void setVerificationExpiresAt(Instant verificationExpiresAt) {
        this.verificationExpiresAt = verificationExpiresAt;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public String getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(String authProvider) {
        this.authProvider = authProvider;
    }

    public String getAuthSubject() {
        return authSubject;
    }

    public void setAuthSubject(String authSubject) {
        this.authSubject = authSubject;
    }

    public String getPendingProvider() {
        return pendingProvider;
    }

    public void setPendingProvider(String pendingProvider) {
        this.pendingProvider = pendingProvider;
    }

    public String getPendingSubject() {
        return pendingSubject;
    }

    public void setPendingSubject(String pendingSubject) {
        this.pendingSubject = pendingSubject;
    }

    public String getPendingFullName() {
        return pendingFullName;
    }

    public void setPendingFullName(String pendingFullName) {
        this.pendingFullName = pendingFullName;
    }

    public String getPendingEmail() {
        return pendingEmail;
    }

    public void setPendingEmail(String pendingEmail) {
        this.pendingEmail = pendingEmail;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
