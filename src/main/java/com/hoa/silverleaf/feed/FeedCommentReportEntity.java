package com.hoa.silverleaf.feed;

import com.hoa.silverleaf.community.CommunityEntity;
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

import java.time.Instant;

@Entity
@Table(name = "feed_comment_report")
public class FeedCommentReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "community_id", nullable = false)
    private CommunityEntity community;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comment_id", nullable = false)
    private FeedPostCommentEntity comment;

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

    public FeedPostCommentEntity getComment() {
        return comment;
    }

    public void setComment(FeedPostCommentEntity comment) {
        this.comment = comment;
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
