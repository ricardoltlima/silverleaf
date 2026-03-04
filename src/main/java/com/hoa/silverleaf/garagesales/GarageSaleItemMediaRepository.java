package com.hoa.silverleaf.garagesales;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GarageSaleItemMediaRepository extends JpaRepository<GarageSaleItemMediaEntity, Long> {
    List<GarageSaleItemMediaEntity> findByItemIdInOrderBySortOrderAscIdAsc(List<Long> itemIds);

    void deleteByItemId(Long itemId);
}
