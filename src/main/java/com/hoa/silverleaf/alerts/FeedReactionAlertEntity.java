package com.hoa.silverleaf.alerts;

import com.hoa.silverleaf.community.CommunityEntity;
import com.hoa.silverleaf.feed.FeedPostEntity;
import com.hoa.silverleaf.feed.FeedReactionType;
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

import java.time.Instant;

@Entity
@Table(name = "feed_reaction_alert")
public class FeedReactionAlertEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "community_id", nullable = false)
    private CommunityEntity community;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private UserEntity recipient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_user_id", nullable = false)
    private UserEntity actor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private FeedPostEntity post;

    @Enumerated(EnumType.STRING)
    @Column(name = "reaction_type", nullable = false, length = 20)
    private FeedReactionType reactionType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "last_reacted_at", nullable = false)
    private Instant lastReactedAt;

    @Column(name = "read_at")
    private Instant readAt;

    public Long getId() {
        return id;
    }

    public CommunityEntity getCommunity() {
        return community;
    }

    public void setCommunity(CommunityEntity community) {
        this.community = community;
    }

    public UserEntity getRecipient() {
        return recipient;
    }

    public void setRecipient(UserEntity recipient) {
        this.recipient = recipient;
    }

    public UserEntity getActor() {
        return actor;
    }

    public void setActor(UserEntity actor) {
        this.actor = actor;
    }

    public FeedPostEntity getPost() {
        return post;
    }

    public void setPost(FeedPostEntity post) {
        this.post = post;
    }

    public FeedReactionType getReactionType() {
        return reactionType;
    }

    public void setReactionType(FeedReactionType reactionType) {
        this.reactionType = reactionType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getLastReactedAt() {
        return lastReactedAt;
    }

    public void setLastReactedAt(Instant lastReactedAt) {
        this.lastReactedAt = lastReactedAt;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
    }
}
