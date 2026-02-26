package com.hoa.silverleaf.houses;

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
@Table(name = "household_membership")
public class HouseResidentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "house_id", nullable = false)
    private HouseEntity house;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resident_id", nullable = false)
    private UserEntity resident;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "moved_in_at", nullable = false)
    private Instant movedInAt;

    @Column(name = "moved_out_at")
    private Instant movedOutAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public HouseEntity getHouse() {
        return house;
    }

    public void setHouse(HouseEntity house) {
        this.house = house;
    }

    public UserEntity getResident() {
        return resident;
    }

    public void setResident(UserEntity resident) {
        this.resident = resident;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getMovedInAt() {
        return movedInAt;
    }

    public void setMovedInAt(Instant movedInAt) {
        this.movedInAt = movedInAt;
    }

    public Instant getMovedOutAt() {
        return movedOutAt;
    }

    public void setMovedOutAt(Instant movedOutAt) {
        this.movedOutAt = movedOutAt;
    }
}
