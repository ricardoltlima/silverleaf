package com.hoa.silverleaf.garagesales;

import com.hoa.silverleaf.garagesales.dto.CreateGarageSaleItemRequest;
import com.hoa.silverleaf.garagesales.dto.GarageSaleItemPageResponse;
import com.hoa.silverleaf.garagesales.dto.GarageSaleItemResponse;
import com.hoa.silverleaf.garagesales.dto.UpdateGarageSaleItemRequest;
import com.hoa.silverleaf.security.AppUserPrincipal;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;

@Slf4j
@RestController
@RequestMapping("/api/v1/garage-sales")
public class GarageSaleController {

    private final GarageSaleService garageSaleService;

    public GarageSaleController(GarageSaleService garageSaleService) {
        this.garageSaleService = garageSaleService;
    }

    @GetMapping
    public GarageSaleItemPageResponse list(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int limit
    ) {
        log.debug("Garage sale items list requested");
        return garageSaleService.listItems(principal, cursor, limit);
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

    @PutMapping("/{itemId}")
    public GarageSaleItemResponse update(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateGarageSaleItemRequest request
    ) {
        log.info("Garage sale item update requested itemId={} userId={}", itemId, principal.getId());
        return garageSaleService.updateItem(principal, itemId, request);
    }

    @DeleteMapping("/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long itemId
    ) {
        log.info("Garage sale item delete requested itemId={} userId={}", itemId, principal.getId());
        garageSaleService.deleteItem(principal, itemId);
    }
}
