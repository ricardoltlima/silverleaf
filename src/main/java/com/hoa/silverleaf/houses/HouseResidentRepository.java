package com.hoa.silverleaf.houses;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HouseResidentRepository extends JpaRepository<HouseResidentEntity, Long> {
    List<HouseResidentEntity> findByHouseIdOrderByIdAsc(Long houseId);

    boolean existsByHouseIdAndEmailIgnoreCase(Long houseId, String email);

    Optional<HouseResidentEntity> findFirstByEmailIgnoreCaseOrderByIdDesc(String email);
}
