package com.hoa.silverleaf.garagesales;

import jakarta.persistence.*;

@Entity
@Table(name = "garage_sale_item_media")
public class GarageSaleItemMediaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private GarageSaleItemEntity item;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 20)
    private GarageSaleMediaType mediaType;

    @Column(name = "media_url", nullable = false, length = 500)
    private String mediaUrl;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public Long getId() {
        return id;
    }

    public GarageSaleItemEntity getItem() {
        return item;
    }

    public void setItem(GarageSaleItemEntity item) {
        this.item = item;
    }

    public GarageSaleMediaType getMediaType() {
        return mediaType;
    }

    public void setMediaType(GarageSaleMediaType mediaType) {
        this.mediaType = mediaType;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public void setMediaUrl(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}
