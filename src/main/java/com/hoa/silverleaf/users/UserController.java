package com.hoa.silverleaf.users;

import com.hoa.silverleaf.users.dto.CreateResidentRequest;
import com.hoa.silverleaf.users.dto.CreateResidentInviteRequest;
import com.hoa.silverleaf.users.dto.AddHouseholdMemberRequest;
import com.hoa.silverleaf.users.dto.HouseholdResponse;
import com.hoa.silverleaf.users.dto.MeResponse;
import com.hoa.silverleaf.users.dto.MyProfileResponse;
import com.hoa.silverleaf.users.dto.NeighborListItemResponse;
import com.hoa.silverleaf.users.dto.NeighborProfileResponse;
import com.hoa.silverleaf.users.dto.ResidentResponse;
import com.hoa.silverleaf.users.dto.ResidentInvitationResponse;
import com.hoa.silverleaf.users.dto.UpdateMyProfileRequest;
import com.hoa.silverleaf.users.dto.UpdateResidentRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

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

    @GetMapping("/me/profile")
    public MyProfileResponse myProfile() {
        log.debug("My profile requested");
        return userService.getMyProfile();
    }

    @PutMapping("/me/profile")
    public MyProfileResponse updateMyProfile(@Valid @RequestBody UpdateMyProfileRequest request) {
        log.info("Self profile update requested");
        return userService.updateMyProfile(request);
    }

    @PostMapping(value = "/me/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MeResponse updateMyPhoto(@RequestPart("file") MultipartFile file) {
        log.info("Self profile photo update requested contentType={} size={}", file.getContentType(), file.getSize());
        return userService.updateMyPhoto(file);
    }

    @GetMapping("/me/household")
    public HouseholdResponse myHousehold() {
        log.info("My household requested");
        return userService.getMyHousehold();
    }

    @GetMapping("/neighbors")
    public java.util.List<NeighborListItemResponse> neighbors() {
        log.debug("Neighbors directory requested");
        return userService.listNeighbors();
    }

    @GetMapping("/neighbors/{id}")
    public NeighborProfileResponse neighborProfile(@PathVariable Long id) {
        log.debug("Neighbor profile requested for userId={}", id);
        return userService.getNeighborProfile(id);
    }

    @PostMapping("/me/household/members")
    @ResponseStatus(HttpStatus.CREATED)
    public HouseholdResponse addHouseholdMember(@Valid @RequestBody AddHouseholdMemberRequest request) {
        log.info("Household member add requested");
        return userService.addHouseholdMember(request);
    }

    @GetMapping("/residents")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    public Page<ResidentResponse> residents(
            @AuthenticationPrincipal com.hoa.silverleaf.security.AppUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String q
    ) {
        log.info("Resident list requested by HOA admin page={}, size={}, q='{}'", page, size, q);
        return userService.listResidents(principal, page, size, q);
    }

    @PostMapping("/residents")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResidentResponse createResident(
            @AuthenticationPrincipal com.hoa.silverleaf.security.AppUserPrincipal principal,
            @Valid @RequestBody CreateResidentRequest request
    ) {
        log.info("Resident create requested by HOA admin emailLength={}", request.email() == null ? 0 : request.email().length());
        return userService.createResident(principal, request);
    }

    @PostMapping("/residents/invitations")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ResidentInvitationResponse createResidentInvitation(
            @AuthenticationPrincipal com.hoa.silverleaf.security.AppUserPrincipal principal,
            @Valid @RequestBody CreateResidentInviteRequest request
    ) {
        log.info("Resident invitation create requested by HOA admin houseId={} emailLength={}",
                request.houseId(), request.email() == null ? 0 : request.email().length());
        return userService.createResidentInvitation(principal, request);
    }

    @GetMapping("/residents/{id}")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    public ResidentResponse residentById(@PathVariable Long id) {
        log.info("Resident details requested by HOA admin for userId={}", id);
        return userService.getResident(id);
    }

    @PutMapping("/residents/{id}")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    public ResidentResponse updateResident(
            @AuthenticationPrincipal com.hoa.silverleaf.security.AppUserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateResidentRequest request
    ) {
        log.info("Resident update requested by HOA admin for userId={}", id);
        return userService.updateResident(principal, id, request);
    }

    @PatchMapping("/residents/{id}/deactivate")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    public ResidentResponse deactivateResident(@PathVariable Long id) {
        log.info("Resident deactivation requested by HOA admin for userId={}", id);
        return userService.deactivateResident(id);
    }

    @PatchMapping("/residents/{id}/activate")
    @PreAuthorize("hasAnyRole('HOA_ADMIN', 'ADMIN')")
    public ResidentResponse activateResident(@PathVariable Long id) {
        log.info("Resident activation requested by HOA admin for userId={}", id);
        return userService.activateResident(id);
    }
}
