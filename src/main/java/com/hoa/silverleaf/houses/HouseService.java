package com.hoa.silverleaf.houses;

import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.houses.dto.CreateHouseRequest;
import com.hoa.silverleaf.houses.dto.HouseResponse;
import com.hoa.silverleaf.houses.dto.HouseResidentResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class HouseService {

    private final HouseRepository houseRepository;
    private final HouseResidentRepository houseResidentRepository;

    public HouseService(HouseRepository houseRepository, HouseResidentRepository houseResidentRepository) {
        this.houseRepository = houseRepository;
        this.houseResidentRepository = houseResidentRepository;
    }

    @Transactional(readOnly = true)
    public List<HouseResponse> listHouses() {
        return houseRepository.findAllByOrderByAddressAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HouseResponse> listPendingHouses() {
        return houseRepository.findByStatusInOrderByAddressAsc(
                        Arrays.asList(HouseStatus.UNKNOWN, HouseStatus.NOT_OCCUPIED)
                ).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public HouseResponse createHouse(CreateHouseRequest request) {
        String normalizedAddress = request.address().trim();
        if (houseRepository.existsByAddressIgnoreCase(normalizedAddress)) {
            throw new IllegalArgumentException("Address already exists");
        }

        HouseEntity house = new HouseEntity();
        house.setAddress(normalizedAddress);
        house.setQrToken(generateUniqueQrToken());
        house.setStatus(HouseStatus.UNKNOWN);
        HouseEntity saved = houseRepository.save(house);
        log.info("House created id={} address={}", saved.getId(), saved.getAddress());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public HouseResponse getHouseByQrToken(String qrToken) {
        HouseEntity house = houseRepository.findByQrToken(qrToken)
                .orElseThrow(() -> new NotFoundException("House not found"));
        return toResponse(house);
    }

    private HouseResponse toResponse(HouseEntity house) {
        List<HouseResidentResponse> residents = houseResidentRepository.findByHouseIdOrderByIdAsc(house.getId())
                .stream()
                .map(resident -> new HouseResidentResponse(
                        resident.getId(),
                        resident.getFullName(),
                        resident.getEmail()
                ))
                .toList();
        return new HouseResponse(
                house.getId(),
                house.getAddress(),
                house.getQrToken(),
                house.getStatus(),
                house.getClaimedAt(),
                residents
        );
    }

    private String generateUniqueQrToken() {
        String token;
        do {
            token = UUID.randomUUID().toString().replace("-", "");
        } while (houseRepository.existsByQrToken(token));
        return token;
    }
}
