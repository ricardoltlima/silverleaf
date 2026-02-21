package com.hoa.silverleaf.houses;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HouseResidentRepository extends JpaRepository<HouseResidentEntity, Long> {
    List<HouseResidentEntity> findByHouseIdOrderByIdAsc(Long houseId);

    boolean existsByHouseIdAndEmailIgnoreCase(Long houseId, String email);
}
