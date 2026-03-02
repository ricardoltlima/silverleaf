package com.hoa.silverleaf.houses;

import com.hoa.silverleaf.houses.dto.CreateHouseRequest;
import com.hoa.silverleaf.houses.dto.HouseResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/houses")
public class HouseController {

    private final HouseService houseService;

    public HouseController(HouseService houseService) {
        this.houseService = houseService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    public List<HouseResponse> houses() {
        log.info("House list requested by HOA admin");
        return houseService.listHouses();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public HouseResponse create(@Valid @RequestBody CreateHouseRequest request) {
        log.info("House create requested addressLength={}", request.address() == null ? 0 : request.address().length());
        return houseService.createHouse(request);
    }
}
