package com.hoa.silverleaf.houses;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HouseResidentRepository extends JpaRepository<HouseResidentEntity, Long> {
    List<HouseResidentEntity> findByHouseIdOrderByIdAsc(Long houseId);

    @Query("""
            select (count(m) > 0) from HouseResidentEntity m
            where m.house.id = :houseId and lower(m.resident.email) = lower(:email)
            """)
    boolean existsByHouseIdAndEmailIgnoreCase(@Param("houseId") Long houseId, @Param("email") String email);

    @Query("""
            select m from HouseResidentEntity m
            where lower(m.resident.email) = lower(:email) and m.active = true
            order by m.id desc
            """)
    Optional<HouseResidentEntity> findFirstByEmailIgnoreCaseOrderByIdDesc(@Param("email") String email);
}
