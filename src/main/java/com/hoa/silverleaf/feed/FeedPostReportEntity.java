package com.hoa.silverleaf.feed;

import com.hoa.silverleaf.community.CommunityEntity;
import com.hoa.silverleaf.users.UserEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "feed_post_report")
public class FeedPostReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "community_id", nullable = false)
    private CommunityEntity community;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private FeedPostEntity post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_user_id", nullable = false)
    private UserEntity reporter;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public CommunityEntity getCommunity() {
        return community;
    }

    public void setCommunity(CommunityEntity community) {
        this.community = community;
    }

    public FeedPostEntity getPost() {
        return post;
    }

    public void setPost(FeedPostEntity post) {
        this.post = post;
    }

    public UserEntity getReporter() {
        return reporter;
    }

    public void setReporter(UserEntity reporter) {
        this.reporter = reporter;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
