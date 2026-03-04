package com.hoa.silverleaf.houses;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HouseRepository extends JpaRepository<HouseEntity, Long> {
    boolean existsByAddressIgnoreCase(String address);
    boolean existsByQrToken(String qrToken);

    List<HouseEntity> findByStatusOrderByAddressAsc(HouseStatus status);
    List<HouseEntity> findByStatusInOrderByAddressAsc(List<HouseStatus> statuses);
    List<HouseEntity> findByCommunityIdOrderByAddressAsc(Long communityId);

    List<HouseEntity> findAllByOrderByAddressAsc();

    Optional<HouseEntity> findByQrToken(String qrToken);
}
