package com.hoa.silverleaf.garagesales;

import com.hoa.silverleaf.community.CommunityEntity;
import com.hoa.silverleaf.users.UserEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "garage_sale_item")
public class GarageSaleItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "community_id", nullable = false)
    private CommunityEntity community;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_user_id", nullable = false)
    private UserEntity seller;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(name = "price_label", nullable = false, length = 60)
    private String priceLabel;

    @Column(name = "condition_label", nullable = false, length = 80)
    private String conditionLabel;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(columnDefinition = "text")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public CommunityEntity getCommunity() {
        return community;
    }

    public void setCommunity(CommunityEntity community) {
        this.community = community;
    }

    public UserEntity getSeller() {
        return seller;
    }

    public void setSeller(UserEntity seller) {
        this.seller = seller;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getPriceLabel() {
        return priceLabel;
    }

    public void setPriceLabel(String priceLabel) {
        this.priceLabel = priceLabel;
    }

    public String getConditionLabel() {
        return conditionLabel;
    }

    public void setConditionLabel(String conditionLabel) {
        this.conditionLabel = conditionLabel;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
