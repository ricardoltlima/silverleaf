package com.hoa.silverleaf.feed;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface FeedPostMediaRepository extends JpaRepository<FeedPostMediaEntity, Long> {
    List<FeedPostMediaEntity> findByPostIdInOrderBySortOrderAscIdAsc(Collection<Long> postIds);
}
