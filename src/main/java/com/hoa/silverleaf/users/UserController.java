package com.hoa.silverleaf.users;

import com.hoa.silverleaf.users.dto.CreateResidentRequest;
import com.hoa.silverleaf.users.dto.MeResponse;
import com.hoa.silverleaf.users.dto.ResidentResponse;
import com.hoa.silverleaf.users.dto.UpdateResidentRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

@Slf4j
@RestController
@RequestMapping("/api/v1")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public MeResponse me() {
        log.debug("Me endpoint requested");
        return userService.me();
    }

    @GetMapping("/residents")
    @PreAuthorize("hasRole('HOA_ADMIN')")
    public Page<ResidentResponse> residents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String q
    ) {
        log.info("Resident list requested by HOA admin page={}, size={}, q='{}'", page, size, q);
        return userService.listResidents(page, size, q);
    }

    @PostMapping("/residents")
    @PreAuthorize("hasRole('HOA_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResidentResponse createResident(@Valid @RequestBody CreateResidentRequest request) {
        log.info("Resident create requested by HOA admin emailLength={}", request.email() == null ? 0 : request.email().length());
        return userService.createResident(request);
    }

    @GetMapping("/residents/{id}")
    @PreAuthorize("hasRole('HOA_ADMIN')")
    public ResidentResponse residentById(@PathVariable Long id) {
        log.info("Resident details requested by HOA admin for userId={}", id);
        return userService.getResident(id);
    }

    @PutMapping("/residents/{id}")
    @PreAuthorize("hasRole('HOA_ADMIN')")
    public ResidentResponse updateResident(@PathVariable Long id, @Valid @RequestBody UpdateResidentRequest request) {
        log.info("Resident update requested by HOA admin for userId={}", id);
        return userService.updateResident(id, request);
    }

    @PatchMapping("/residents/{id}/deactivate")
    @PreAuthorize("hasRole('HOA_ADMIN')")
    public ResidentResponse deactivateResident(@PathVariable Long id) {
        log.info("Resident deactivation requested by HOA admin for userId={}", id);
        return userService.deactivateResident(id);
    }

    @PatchMapping("/residents/{id}/activate")
    @PreAuthorize("hasRole('HOA_ADMIN')")
    public ResidentResponse activateResident(@PathVariable Long id) {
        log.info("Resident activation requested by HOA admin for userId={}", id);
        return userService.activateResident(id);
    }
}
