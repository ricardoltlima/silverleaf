package com.hoa.silverleaf.board;

import com.hoa.silverleaf.users.UserEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "violation_report")
public class ViolationReportEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_user_id", nullable = false)
    private UserEntity reporter;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "media_urls_text", columnDefinition = "text")
    private String mediaUrlsText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ViolationStatus status = ViolationStatus.OPEN;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getId() { return id; }
    public UserEntity getReporter() { return reporter; }
    public void setReporter(UserEntity reporter) { this.reporter = reporter; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public String getMediaUrlsText() { return mediaUrlsText; }
    public void setMediaUrlsText(String mediaUrlsText) { this.mediaUrlsText = mediaUrlsText; }
    public ViolationStatus getStatus() { return status; }
    public void setStatus(ViolationStatus status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
}
