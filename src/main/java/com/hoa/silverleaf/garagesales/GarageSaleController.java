package com.hoa.silverleaf.garagesales;

import com.hoa.silverleaf.garagesales.dto.CreateGarageSaleItemRequest;
import com.hoa.silverleaf.garagesales.dto.GarageSaleItemResponse;
import com.hoa.silverleaf.security.AppUserPrincipal;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/garage-sales")
public class GarageSaleController {

    private final GarageSaleService garageSaleService;

    public GarageSaleController(GarageSaleService garageSaleService) {
        this.garageSaleService = garageSaleService;
    }

    @GetMapping
    public List<GarageSaleItemResponse> list() {
        log.debug("Garage sale items list requested");
        return garageSaleService.listItems();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GarageSaleItemResponse create(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @Valid @RequestBody CreateGarageSaleItemRequest request
    ) {
        log.info("Garage sale item create requested by userId={}", principal.getId());
        return garageSaleService.createItem(principal, request);
    }
}
