package com.hoa.silverleaf.users;

import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.houses.HouseEntity;
import com.hoa.silverleaf.houses.HouseResidentEntity;
import com.hoa.silverleaf.houses.HouseResidentRepository;
import com.hoa.silverleaf.houses.dto.HouseResidentResponse;
import com.hoa.silverleaf.security.AppUserPrincipal;
import com.hoa.silverleaf.users.dto.AddHouseholdMemberRequest;
import com.hoa.silverleaf.users.dto.CreateResidentRequest;
import com.hoa.silverleaf.users.dto.HouseholdResponse;
import com.hoa.silverleaf.users.dto.MeResponse;
import com.hoa.silverleaf.users.dto.MyProfileResponse;
import com.hoa.silverleaf.users.dto.ResidentResponse;
import com.hoa.silverleaf.users.dto.UpdateMyProfileRequest;
import com.hoa.silverleaf.users.dto.UpdateResidentRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
public class UserService {

    private final UserRepository userRepository;
    private final HouseResidentRepository houseResidentRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProfilePhotoStorageService profilePhotoStorageService;

    public UserService(
            UserRepository userRepository,
            HouseResidentRepository houseResidentRepository,
            PasswordEncoder passwordEncoder,
            ProfilePhotoStorageService profilePhotoStorageService
    ) {
        this.userRepository = userRepository;
        this.houseResidentRepository = houseResidentRepository;
        this.passwordEncoder = passwordEncoder;
        this.profilePhotoStorageService = profilePhotoStorageService;
    }

    public MeResponse me() {
        AppUserPrincipal principal = requirePrincipal();
        log.debug("Authenticated principal resolved. userId={}, email={}", principal.getId(), principal.getUsername());
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));
        return new MeResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getPhotoUrl());
    }

    @Transactional(readOnly = true)
    public Page<ResidentResponse> listResidents(int page, int size, String q) {
        // Guardrails prevent abusive page sizes and negative offsets from clients.
        int pageNumber = Math.max(0, page);
        int pageSize = Math.max(1, Math.min(size, 100));
        String normalizedQuery = q == null ? "" : q.trim();
        var pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));

        log.debug("Listing residents page={}, size={}, q='{}'", pageNumber, pageSize, normalizedQuery);
        if (normalizedQuery.isBlank()) {
            Page<ResidentResponse> residents = userRepository.findByRole(UserRole.RESIDENT, pageable)
                    .map(this::toResidentResponse);
            log.debug("Residents listed without query resultCount={} page={} size={}",
                    residents.getNumberOfElements(), pageNumber, pageSize);
            return residents;
        }

        Page<ResidentResponse> residents = userRepository.searchByRoleAndQuery(UserRole.RESIDENT, normalizedQuery, pageable)
                .map(this::toResidentResponse);
        log.debug("Residents listed with query='{}' resultCount={} page={} size={}",
                normalizedQuery, residents.getNumberOfElements(), pageNumber, pageSize);
        return residents;
    }

    @Transactional
    public ResidentResponse createResident(CreateResidentRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.warn("Resident creation rejected because email already exists: {}", normalizedEmail);
            throw new IllegalArgumentException("Email already registered");
        }

        UserEntity user = new UserEntity();
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.RESIDENT);

        UserEntity savedUser = userRepository.save(user);
        log.info("Resident created successfully. userId={}, email={}", savedUser.getId(), savedUser.getEmail());
        return toResidentResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public ResidentResponse getResident(Long id) {
        log.debug("Resident details requested userId={}", id);
        UserEntity resident = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resident not found"));
        return toResidentResponse(resident);
    }

    @Transactional
    public ResidentResponse updateResident(Long id, UpdateResidentRequest request) {
        UserEntity resident = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resident not found"));

        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        if (!resident.getEmail().equalsIgnoreCase(normalizedEmail)
                && userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.warn("Resident update rejected due to duplicated email={} for userId={}", normalizedEmail, id);
            throw new IllegalArgumentException("Email already registered");
        }

        resident.setFullName(request.fullName().trim());
        resident.setEmail(normalizedEmail);
        if (request.password() != null) {
            resident.setPasswordHash(passwordEncoder.encode(request.password()));
            log.info("Resident password reset by admin for userId={}", id);
        }

        UserEntity savedResident = userRepository.save(resident);
        log.info("Resident updated successfully. userId={}, email={}", savedResident.getId(), savedResident.getEmail());
        return toResidentResponse(savedResident);
    }

    @Transactional
    public ResidentResponse deactivateResident(Long id) {
        UserEntity resident = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resident not found"));
        if (!resident.isEnabled()) {
            log.debug("Resident already deactivated userId={}", id);
        }
        resident.setEnabled(false);
        UserEntity savedResident = userRepository.save(resident);
        log.info("Resident deactivated. userId={}, email={}", savedResident.getId(), savedResident.getEmail());
        return toResidentResponse(savedResident);
    }

    @Transactional
    public ResidentResponse activateResident(Long id) {
        UserEntity resident = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resident not found"));
        if (resident.isEnabled()) {
            log.debug("Resident already active userId={}", id);
        }
        resident.setEnabled(true);
        UserEntity savedResident = userRepository.save(resident);
        log.info("Resident activated. userId={}, email={}", savedResident.getId(), savedResident.getEmail());
        return toResidentResponse(savedResident);
    }

    private ResidentResponse toResidentResponse(UserEntity user) {
        return new ResidentResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isEnabled()
        );
    }

    @Transactional
    public MyProfileResponse getMyProfile() {
        AppUserPrincipal principal = requirePrincipal();
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));
        String address = houseResidentRepository.findFirstByEmailIgnoreCaseOrderByIdDesc(user.getEmail())
                .map(entry -> entry.getHouse().getAddress())
                .orElse(null);
        return toMyProfileResponse(user, address);
    }

    @Transactional
    public MyProfileResponse updateMyProfile(UpdateMyProfileRequest request) {
        AppUserPrincipal principal = requirePrincipal();
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        if (!user.getEmail().equalsIgnoreCase(normalizedEmail) && userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.warn("Self profile update rejected due to duplicated email={} userId={}", normalizedEmail, user.getId());
            throw new IllegalArgumentException("Email already registered");
        }

        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPhoneNumber(trimToNull(request.phoneNumber()));
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
            log.info("Self-service password updated userId={}", user.getId());
        }
        user.setServiceEnabled(request.serviceEnabled());
        user.setServiceTitle(trimToNull(request.serviceTitle()));
        user.setServiceDescription(trimToNull(request.serviceDescription()));
        user.setServiceContactPhone(trimToNull(request.serviceContactPhone()));
        user.setServiceContactEmail(trimToNull(request.serviceContactEmail()));
        user.setServiceBusinessUrl(trimToNull(request.serviceBusinessUrl()));
        user.setServiceHours(trimToNull(request.serviceHours()));
        user.setServiceArea(trimToNull(request.serviceArea()));
        user.setServiceVisibility(parseVisibility(request.serviceVisibility()));

        UserEntity saved = userRepository.save(user);
        log.info("Self-service profile updated userId={}", saved.getId());
        String address = houseResidentRepository.findFirstByEmailIgnoreCaseOrderByIdDesc(saved.getEmail())
                .map(entry -> entry.getHouse().getAddress())
                .orElse(null);
        return toMyProfileResponse(saved, address);
    }

    @Transactional
    public MeResponse updateMyPhoto(MultipartFile file) {
        AppUserPrincipal principal = requirePrincipal();
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        String oldPhotoUrl = user.getPhotoUrl();
        String storedPhotoUrl = profilePhotoStorageService.saveProfilePhoto(file);
        user.setPhotoUrl(storedPhotoUrl);
        UserEntity saved = userRepository.save(user);
        profilePhotoStorageService.deleteIfLocal(oldPhotoUrl);
        log.info("Self-service profile photo updated userId={} photoUrl={}", saved.getId(), saved.getPhotoUrl());
        return new MeResponse(saved.getId(), saved.getEmail(), saved.getFullName(), saved.getRole(), saved.getPhotoUrl());
    }

    @Transactional(readOnly = true)
    public HouseholdResponse getMyHousehold() {
        AppUserPrincipal principal = requirePrincipal();
        return houseResidentRepository.findFirstByEmailIgnoreCaseOrderByIdDesc(principal.getUsername())
                .map(me -> toHouseholdResponse(me.getHouse()))
                .orElseGet(() -> {
                    log.debug("No household linked for user email={}, returning empty household response", principal.getUsername());
                    return new HouseholdResponse(null, null, com.hoa.silverleaf.houses.HouseStatus.UNKNOWN, List.of());
                });
    }

    @Transactional
    public HouseholdResponse addHouseholdMember(AddHouseholdMemberRequest request) {
        AppUserPrincipal principal = requirePrincipal();
        HouseResidentEntity me = houseResidentRepository.findFirstByEmailIgnoreCaseOrderByIdDesc(principal.getUsername())
                .orElseThrow(() -> new NotFoundException("No household found for this resident"));

        HouseEntity house = me.getHouse();
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        if (houseResidentRepository.existsByHouseIdAndEmailIgnoreCase(house.getId(), normalizedEmail)) {
            log.warn("Household member add blocked due to duplicate houseId={} email={}", house.getId(), normalizedEmail);
            throw new IllegalArgumentException("Resident already added to this household");
        }

        HouseResidentEntity resident = new HouseResidentEntity();
        resident.setHouse(house);
        resident.setResident(ensureResidentUserExists(normalizedEmail, request.fullName().trim()));
        resident.setActive(true);
        resident.setMovedInAt(Instant.now());
        houseResidentRepository.save(resident);
        log.info("Household member added houseId={} email={}", house.getId(), normalizedEmail);
        return toHouseholdResponse(house);
    }

    private UserEntity ensureResidentUserExists(String normalizedEmail, String fullName) {
        return userRepository.findByEmailIgnoreCase(normalizedEmail).map(existingUser -> {
            if (!existingUser.getFullName().equals(fullName.trim())) {
                existingUser.setFullName(fullName.trim());
                existingUser = userRepository.save(existingUser);
                log.info("Synced app_user fullName from household member email={}", normalizedEmail);
            }
            return existingUser;
        }).orElseGet(() -> {
            UserEntity user = new UserEntity();
            user.setEmail(normalizedEmail);
            user.setFullName(fullName.trim());
            // Household members added by residents may not have passwords yet; store random placeholder hash.
            user.setPasswordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            user.setRole(UserRole.RESIDENT);
            user.setEnabled(true);
            UserEntity saved = userRepository.save(user);
            log.info("Created app_user for household member email={}", normalizedEmail);
            return saved;
        });
    }

    private HouseholdResponse toHouseholdResponse(HouseEntity house) {
        var residents = houseResidentRepository.findByHouseIdOrderByIdAsc(house.getId()).stream()
                .map(r -> new HouseResidentResponse(r.getId(), r.getResident().getFullName(), r.getResident().getEmail()))
                .toList();
        return new HouseholdResponse(house.getId(), house.getAddress(), house.getStatus(), residents);
    }

    private MyProfileResponse toMyProfileResponse(UserEntity user, String address) {
        return new MyProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhotoUrl(),
                user.getPhoneNumber(),
                address,
                user.isServiceEnabled(),
                user.getServiceTitle(),
                user.getServiceDescription(),
                user.getServiceContactPhone(),
                user.getServiceContactEmail(),
                user.getServiceBusinessUrl(),
                user.getServiceHours(),
                user.getServiceArea(),
                user.getServiceVisibility() == null ? ServiceVisibility.PUBLIC.name() : user.getServiceVisibility().name()
        );
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ServiceVisibility parseVisibility(String rawVisibility) {
        if (rawVisibility == null || rawVisibility.isBlank()) {
            return ServiceVisibility.PUBLIC;
        }
        try {
            return ServiceVisibility.valueOf(rawVisibility.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ignored) {
            log.warn("Unknown service visibility provided rawVisibility={}, defaulting to PUBLIC", rawVisibility);
            return ServiceVisibility.PUBLIC;
        }
    }

    private AppUserPrincipal requirePrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
            log.warn("Authenticated principal required but not found");
            throw new IllegalArgumentException("Not authenticated");
        }
        return principal;
    }
}
