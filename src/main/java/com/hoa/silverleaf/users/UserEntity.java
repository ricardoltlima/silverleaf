package com.hoa.silverleaf.users;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "resident")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 320)
    private String email;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "phone_number", length = 40)
    private String phoneNumber;

    @Column(name = "service_enabled", nullable = false)
    private boolean serviceEnabled;

    @Column(name = "service_title", length = 140)
    private String serviceTitle;

    @Column(name = "service_description")
    private String serviceDescription;

    @Column(name = "service_contact_phone", length = 40)
    private String serviceContactPhone;

    @Column(name = "service_contact_email", length = 320)
    private String serviceContactEmail;

    @Column(name = "service_business_url", length = 500)
    private String serviceBusinessUrl;

    @Column(name = "service_hours", length = 160)
    private String serviceHours;

    @Column(name = "service_area", length = 160)
    private String serviceArea;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_visibility", nullable = false, length = 30)
    private ServiceVisibility serviceVisibility = ServiceVisibility.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserRole role;

    @Column(nullable = false)
    private boolean enabled = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public boolean isServiceEnabled() {
        return serviceEnabled;
    }

    public void setServiceEnabled(boolean serviceEnabled) {
        this.serviceEnabled = serviceEnabled;
    }

    public String getServiceTitle() {
        return serviceTitle;
    }

    public void setServiceTitle(String serviceTitle) {
        this.serviceTitle = serviceTitle;
    }

    public String getServiceDescription() {
        return serviceDescription;
    }

    public void setServiceDescription(String serviceDescription) {
        this.serviceDescription = serviceDescription;
    }

    public String getServiceContactPhone() {
        return serviceContactPhone;
    }

    public void setServiceContactPhone(String serviceContactPhone) {
        this.serviceContactPhone = serviceContactPhone;
    }

    public String getServiceContactEmail() {
        return serviceContactEmail;
    }

    public void setServiceContactEmail(String serviceContactEmail) {
        this.serviceContactEmail = serviceContactEmail;
    }

    public String getServiceBusinessUrl() {
        return serviceBusinessUrl;
    }

    public void setServiceBusinessUrl(String serviceBusinessUrl) {
        this.serviceBusinessUrl = serviceBusinessUrl;
    }

    public String getServiceHours() {
        return serviceHours;
    }

    public void setServiceHours(String serviceHours) {
        this.serviceHours = serviceHours;
    }

    public String getServiceArea() {
        return serviceArea;
    }

    public void setServiceArea(String serviceArea) {
        this.serviceArea = serviceArea;
    }

    public ServiceVisibility getServiceVisibility() {
        return serviceVisibility;
    }

    public void setServiceVisibility(ServiceVisibility serviceVisibility) {
        this.serviceVisibility = serviceVisibility;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
}
