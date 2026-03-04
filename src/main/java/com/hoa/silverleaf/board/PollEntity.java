package com.hoa.silverleaf.board;

import com.hoa.silverleaf.community.CommunityEntity;
import com.hoa.silverleaf.users.UserEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "board_poll")
public class PollEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "community_id", nullable = false)
    private CommunityEntity community;

    @Column(nullable = false, length = 300)
    private String question;

    @Column(name = "options_text", nullable = false, columnDefinition = "text")
    private String optionsText;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_user_id", nullable = false)
    private UserEntity author;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Long getId() { return id; }
    public CommunityEntity getCommunity() { return community; }
    public void setCommunity(CommunityEntity community) { this.community = community; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getOptionsText() { return optionsText; }
    public void setOptionsText(String optionsText) { this.optionsText = optionsText; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public UserEntity getAuthor() { return author; }
    public void setAuthor(UserEntity author) { this.author = author; }
    public Instant getCreatedAt() { return createdAt; }
}
