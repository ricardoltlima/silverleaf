package com.hoa.silverleaf.board;

import com.hoa.silverleaf.users.UserEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "board_poll_vote")
public class PollVoteEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "poll_id", nullable = false)
    private PollEntity poll;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "voter_user_id", nullable = false)
    private UserEntity voter;

    @Column(name = "option_index", nullable = false)
    private int optionIndex;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Long getId() { return id; }
    public PollEntity getPoll() { return poll; }
    public void setPoll(PollEntity poll) { this.poll = poll; }
    public UserEntity getVoter() { return voter; }
    public void setVoter(UserEntity voter) { this.voter = voter; }
    public int getOptionIndex() { return optionIndex; }
    public void setOptionIndex(int optionIndex) { this.optionIndex = optionIndex; }
}
