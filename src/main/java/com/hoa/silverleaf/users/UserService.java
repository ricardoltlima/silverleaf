package com.hoa.silverleaf.users;

import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.community.CommunityAccessService;
import com.hoa.silverleaf.community.ResidentCommunityMembershipEntity;
import com.hoa.silverleaf.community.ResidentCommunityMembershipRepository;
import com.hoa.silverleaf.community.ResidentCommunityMembershipService;
import com.hoa.silverleaf.houses.HouseEntity;
import com.hoa.silverleaf.houses.HouseResidentEntity;
import com.hoa.silverleaf.houses.HouseResidentRepository;
import com.hoa.silverleaf.houses.HouseRepository;
import com.hoa.silverleaf.houses.HouseStatus;
import com.hoa.silverleaf.houses.onboarding.OnboardingNotificationService;
import com.hoa.silverleaf.houses.onboarding.ResidentInvitationEntity;
import com.hoa.silverleaf.houses.onboarding.ResidentInvitationRepository;
import com.hoa.silverleaf.houses.onboarding.ResidentInvitationStatus;
import com.hoa.silverleaf.houses.dto.HouseResidentResponse;
import com.hoa.silverleaf.security.AppUserPrincipal;
import com.hoa.silverleaf.users.dto.AddHouseholdMemberRequest;
import com.hoa.silverleaf.users.dto.CreateResidentRequest;
import com.hoa.silverleaf.users.dto.CreateResidentInviteRequest;
import com.hoa.silverleaf.users.dto.HouseholdResponse;
import com.hoa.silverleaf.users.dto.MeResponse;
import com.hoa.silverleaf.users.dto.MyProfileResponse;
import com.hoa.silverleaf.users.dto.NeighborListItemResponse;
import com.hoa.silverleaf.users.dto.NeighborProfileResponse;
import com.hoa.silverleaf.users.dto.CommunityMembershipResponse;
import com.hoa.silverleaf.users.dto.ResidentResponse;
import com.hoa.silverleaf.users.dto.ResidentInvitationResponse;
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
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
public class UserService {

    private final UserRepository userRepository;
    private final HouseResidentRepository houseResidentRepository;
    private final HouseRepository houseRepository;
    private final ResidentInvitationRepository residentInvitationRepository;
    private final OnboardingNotificationService onboardingNotificationService;
    private final PasswordEncoder passwordEncoder;
    private final ProfilePhotoStorageService profilePhotoStorageService;
    private final CommunityAccessService communityAccessService;
    private final ResidentCommunityMembershipService residentCommunityMembershipService;
    private final ResidentCommunityMembershipRepository residentCommunityMembershipRepository;

    public UserService(
            UserRepository userRepository,
            HouseResidentRepository houseResidentRepository,
            HouseRepository houseRepository,
            ResidentInvitationRepository residentInvitationRepository,
            OnboardingNotificationService onboardingNotificationService,
            PasswordEncoder passwordEncoder,
            ProfilePhotoStorageService profilePhotoStorageService,
            CommunityAccessService communityAccessService,
            ResidentCommunityMembershipService residentCommunityMembershipService,
            ResidentCommunityMembershipRepository residentCommunityMembershipRepository
    ) {
        this.userRepository = userRepository;
        this.houseResidentRepository = houseResidentRepository;
        this.houseRepository = houseRepository;
        this.residentInvitationRepository = residentInvitationRepository;
        this.onboardingNotificationService = onboardingNotificationService;
        this.passwordEncoder = passwordEncoder;
        this.profilePhotoStorageService = profilePhotoStorageService;
        this.communityAccessService = communityAccessService;
        this.residentCommunityMembershipService = residentCommunityMembershipService;
        this.residentCommunityMembershipRepository = residentCommunityMembershipRepository;
    }

    public MeResponse me() {
        AppUserPrincipal principal = requirePrincipal();
        log.debug("Authenticated principal resolved. userId={}, email={}", principal.getId(), principal.getUsername());
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));
        return new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getPhotoUrl(),
                principal.getActiveCommunityId(),
                principal.getActiveCommunitySlug(),
                principal.getActiveCommunityName(),
                communityAccessService.isCurrentCommunityAdmin(principal)
        );
    }

    @Transactional(readOnly = true)
    public List<CommunityMembershipResponse> listMyCommunities() {
        AppUserPrincipal principal = requirePrincipal();
        return residentCommunityMembershipRepository.findByResidentIdOrderByActiveDescUpdatedAtDescIdDesc(principal.getId()).stream()
                .map(membership -> toCommunityMembershipResponse(
                        membership,
                        membership.getCommunity().getId().equals(principal.getActiveCommunityId())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ResidentResponse> listResidents(AppUserPrincipal principal, int page, int size, String q) {
        communityAccessService.requireCurrentCommunityAdmin(principal);
        // Guardrails prevent abusive page sizes and negative offsets from clients.
        int pageNumber = Math.max(0, page);
        int pageSize = Math.max(1, Math.min(size, 100));
        String normalizedQuery = q == null ? "" : q.trim();
        var pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "id"));
        Long communityId = communityAccessService.requireCommunityIdForPrincipal(principal);
        Set<UserRole> roles = listableRolesFor(principal);
        List<Long> residentIds = residentCommunityMembershipRepository.findActiveResidentIdsByCommunityId(
                communityId
        );

        if (residentIds.isEmpty()) {
            return Page.empty(pageable);
        }

        log.debug("Listing residents page={}, size={}, q='{}'", pageNumber, pageSize, normalizedQuery);
        if (normalizedQuery.isBlank()) {
            Page<ResidentResponse> residents = userRepository.findByIdInAndRoleIn(residentIds, roles, pageable)
                    .map(user -> toResidentResponse(user, communityId));
            log.debug("Residents listed without query resultCount={} page={} size={}",
                    residents.getNumberOfElements(), pageNumber, pageSize);
            return residents;
        }

        Page<ResidentResponse> residents = userRepository.searchByIdInAndRoleInAndQuery(residentIds, roles, normalizedQuery, pageable)
                .map(user -> toResidentResponse(user, communityId));
        log.debug("Residents listed with query='{}' resultCount={} page={} size={}",
                normalizedQuery, residents.getNumberOfElements(), pageNumber, pageSize);
        return residents;
    }

    @Transactional(readOnly = true)
    public List<NeighborListItemResponse> listNeighbors() {
        AppUserPrincipal principal = requirePrincipal();
        List<Long> residentIds = residentCommunityMembershipRepository.findActiveResidentIdsByCommunityId(
                communityAccessService.requireCommunityIdForPrincipal(principal)
        );
        List<UserEntity> residents = userRepository.findByIdInAndRoleInAndEnabledTrueOrderByFullNameAsc(
                        residentIds,
                        Set.of(UserRole.RESIDENT, UserRole.TENANT, UserRole.HOA_ADMIN)
                ).stream()
                .filter(user -> !user.getId().equals(principal.getId()))
                .toList();
        Map<Long, String> addressesByResidentId = resolveActiveAddresses(
                residents.stream().map(UserEntity::getId).toList()
        );
        return residents.stream()
                .map(user -> new NeighborListItemResponse(
                        user.getId(),
                        user.getFullName(),
                        user.getPhotoUrl(),
                        user.isAddressVisible() ? addressesByResidentId.get(user.getId()) : null,
                        user.isServiceEnabled(),
                        user.getServiceTitle()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public NeighborProfileResponse getNeighborProfile(Long neighborId) {
        AppUserPrincipal principal = requirePrincipal();
        communityAccessService.requireUsersInSameCommunity(principal, neighborId);
        if (principal.getId().equals(neighborId)) {
            log.debug("Neighbor profile requested for current user userId={}", neighborId);
        }
        UserEntity user = userRepository.findById(neighborId)
                .filter(candidate -> candidate.getRole().isCommunityMember())
                .orElseThrow(() -> new NotFoundException("Neighbor not found"));
        String address = houseResidentRepository.findFirstActiveByResidentIdOrderByMovedInAtDescIdDesc(user.getId())
                .map(entry -> entry.getHouse().getAddress())
                .orElse(null);
        return new NeighborProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhotoUrl(),
                user.isAddressVisible() ? address : null,
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

    @Transactional
    public ResidentResponse createResident(AppUserPrincipal principal, CreateResidentRequest request) {
        communityAccessService.requireCurrentCommunityAdmin(principal);
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.warn("Resident creation rejected because email already exists: {}", normalizedEmail);
            throw new IllegalArgumentException("Email already registered");
        }
        UserRole requestedRole = assignableRoleFor(principal, request.role());
        boolean communityAdmin = normalizeCommunityAdminAssignment(principal, requestedRole, request.communityAdmin(), false);

        UserEntity user = new UserEntity();
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(requestedRole);

        UserEntity savedUser = userRepository.save(user);
        var community = communityAccessService.requireCommunityForPrincipal(principal);
        residentCommunityMembershipService.activateMembership(savedUser, community);
        residentCommunityMembershipService.syncCommunityAdmin(savedUser, community, communityAdmin);
        log.info("Resident created successfully. userId={}, email={}", savedUser.getId(), savedUser.getEmail());
        return toResidentResponse(savedUser, community.getId());
    }

    @Transactional
    public ResidentInvitationResponse createResidentInvitation(AppUserPrincipal principal, CreateResidentInviteRequest request) {
        communityAccessService.requireCurrentCommunityAdmin(principal);
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.warn("Resident invitation rejected because email already exists: {}", normalizedEmail);
            throw new IllegalArgumentException("Email already registered");
        }
        UserRole requestedRole = assignableRoleFor(principal, request.role());
        boolean communityAdmin = normalizeCommunityAdminAssignment(principal, requestedRole, request.communityAdmin(), false);

        UserEntity invitedBy = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("Inviting admin not found"));
        HouseEntity house = houseRepository.findById(request.houseId())
                .orElseThrow(() -> new NotFoundException("House not found"));
        communityAccessService.requireHouseInUserCommunity(principal.getId(), house);

        UserEntity resident = new UserEntity();
        resident.setFullName(request.fullName().trim());
        resident.setEmail(normalizedEmail);
        resident.setPasswordHash(passwordEncoder.encode(request.password()));
        resident.setRole(requestedRole);
        resident.setEnabled(true);
        UserEntity savedResident = userRepository.save(resident);
        residentCommunityMembershipService.activateMembership(savedResident, house.getCommunity());
        residentCommunityMembershipService.syncCommunityAdmin(savedResident, house.getCommunity(), communityAdmin);

        ResidentInvitationEntity invitation = new ResidentInvitationEntity();
        invitation.setResident(savedResident);
        invitation.setHouse(house);
        invitation.setInvitedBy(invitedBy);
        invitation.setInvitationToken(generateUniqueInvitationToken());
        invitation.setStatus(ResidentInvitationStatus.PENDING);
        invitation.setExpiresAt(Instant.now().plus(14, java.time.temporal.ChronoUnit.DAYS));
        ResidentInvitationEntity savedInvitation = residentInvitationRepository.save(invitation);

        onboardingNotificationService.sendResidentInvitation(
                savedResident.getEmail(),
                savedResident.getFullName(),
                house.getAddress(),
                savedInvitation.getInvitationToken()
        );
        String inviteUrl = onboardingNotificationService.buildResidentInviteUrl(savedInvitation.getInvitationToken());
        log.info("Resident invitation created residentId={} houseId={} invitedByUserId={}",
                savedResident.getId(), house.getId(), invitedBy.getId());
        return new ResidentInvitationResponse(
                savedResident.getId(),
                savedResident.getFullName(),
                savedResident.getEmail(),
                savedResident.getRole(),
                house.getId(),
                house.getAddress(),
                savedInvitation.getInvitationToken(),
                inviteUrl,
                savedInvitation.getExpiresAt()
        );
    }

    @Transactional(readOnly = true)
    public ResidentResponse getResident(Long id) {
        AppUserPrincipal principal = requirePrincipal();
        communityAccessService.requireCurrentCommunityAdmin(principal);
        communityAccessService.requireUsersInSameCommunity(principal, id);
        log.debug("Resident details requested userId={}", id);
        UserEntity resident = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resident not found"));
        return toResidentResponse(resident, communityAccessService.requireCommunityIdForPrincipal(principal));
    }

    @Transactional
    public ResidentResponse updateResident(AppUserPrincipal principal, Long id, UpdateResidentRequest request) {
        communityAccessService.requireCurrentCommunityAdmin(principal);
        communityAccessService.requireUsersInSameCommunity(principal, id);
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
        resident.setRole(assignableRoleFor(principal, request.role() == null ? resident.getRole() : request.role()));
        boolean communityAdmin = normalizeCommunityAdminAssignment(
                principal,
                resident.getRole(),
                request.communityAdmin(),
                currentCommunityAdminFor(principal, resident.getId())
        );
        if (request.password() != null) {
            resident.setPasswordHash(passwordEncoder.encode(request.password()));
            log.info("Resident password reset by admin for userId={}", id);
        }

        UserEntity savedResident = userRepository.save(resident);
        residentCommunityMembershipService.syncCommunityAdmin(
                savedResident,
                communityAccessService.requireCommunityForPrincipal(principal),
                communityAdmin
        );
        log.info("Resident updated successfully. userId={}, email={}", savedResident.getId(), savedResident.getEmail());
        return toResidentResponse(savedResident, communityAccessService.requireCommunityIdForPrincipal(principal));
    }

    @Transactional
    public ResidentResponse deactivateResident(AppUserPrincipal principal, Long id) {
        communityAccessService.requireCurrentCommunityAdmin(principal);
        communityAccessService.requireUsersInSameCommunity(principal, id);
        UserEntity resident = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resident not found"));
        if (!resident.isEnabled()) {
            log.debug("Resident already deactivated userId={}", id);
        }
        resident.setEnabled(false);
        UserEntity savedResident = userRepository.save(resident);
        log.info("Resident deactivated. userId={}, email={}", savedResident.getId(), savedResident.getEmail());
        return toResidentResponse(savedResident, communityAccessService.requireCommunityIdForPrincipal(principal));
    }

    @Transactional
    public ResidentResponse activateResident(AppUserPrincipal principal, Long id) {
        communityAccessService.requireCurrentCommunityAdmin(principal);
        communityAccessService.requireUsersInSameCommunity(principal, id);
        UserEntity resident = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Resident not found"));
        if (resident.isEnabled()) {
            log.debug("Resident already active userId={}", id);
        }
        resident.setEnabled(true);
        UserEntity savedResident = userRepository.save(resident);
        log.info("Resident activated. userId={}, email={}", savedResident.getId(), savedResident.getEmail());
        return toResidentResponse(savedResident, communityAccessService.requireCommunityIdForPrincipal(principal));
    }

    private ResidentResponse toResidentResponse(UserEntity user, Long communityId) {
        return new ResidentResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isEnabled(),
                residentCommunityMembershipRepository.findByResidentIdAndCommunityId(user.getId(), communityId)
                        .map(ResidentCommunityMembershipEntity::isCommunityAdmin)
                        .orElse(false)
        );
    }

    @Transactional
    public MyProfileResponse getMyProfile() {
        AppUserPrincipal principal = requirePrincipal();
        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));
        String address = houseResidentRepository.findFirstActiveByResidentIdOrderByMovedInAtDescIdDesc(user.getId())
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
        user.setAddressVisible(request.addressVisible());
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
        String address = houseResidentRepository.findFirstActiveByResidentIdOrderByMovedInAtDescIdDesc(saved.getId())
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
        return new MeResponse(
                saved.getId(),
                saved.getEmail(),
                saved.getFullName(),
                saved.getRole(),
                saved.getPhotoUrl(),
                principal.getActiveCommunityId(),
                principal.getActiveCommunitySlug(),
                principal.getActiveCommunityName(),
                communityAccessService.isCurrentCommunityAdmin(principal)
        );
    }

    @Transactional(readOnly = true)
    public HouseholdResponse getMyHousehold() {
        AppUserPrincipal principal = requirePrincipal();
        return houseResidentRepository.findFirstActiveByResidentIdOrderByMovedInAtDescIdDesc(principal.getId())
                .map(me -> toHouseholdResponse(me.getHouse()))
                .orElseGet(() -> {
                    log.debug("No household linked for user email={}, returning empty household response", principal.getUsername());
                    return new HouseholdResponse(null, null, com.hoa.silverleaf.houses.HouseStatus.UNKNOWN, List.of());
                });
    }

    @Transactional
    public HouseholdResponse addHouseholdMember(AddHouseholdMemberRequest request) {
        AppUserPrincipal principal = requirePrincipal();
        HouseResidentEntity me = houseResidentRepository.findFirstActiveByResidentIdOrderByMovedInAtDescIdDesc(principal.getId())
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
        residentCommunityMembershipService.activateMembership(resident.getResident(), house.getCommunity());
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
                user.isAddressVisible(),
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

    private Map<Long, String> resolveActiveAddresses(List<Long> residentIds) {
        if (residentIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, String> addressesByResidentId = new LinkedHashMap<>();
        houseResidentRepository.findActiveByResidentIdsOrderByMovedInAtDescIdDesc(residentIds)
                .forEach(membership -> addressesByResidentId.putIfAbsent(
                        membership.getResident().getId(),
                        membership.getHouse().getAddress()
                ));
        return addressesByResidentId;
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

    private Set<UserRole> listableRolesFor(AppUserPrincipal principal) {
        if (principal.getRole() == UserRole.ADMIN) {
            return Set.of(UserRole.RESIDENT, UserRole.TENANT, UserRole.HOA_ADMIN, UserRole.ADMIN);
        }
        return Set.of(UserRole.RESIDENT, UserRole.TENANT, UserRole.HOA_ADMIN);
    }

    private UserRole assignableRoleFor(AppUserPrincipal principal, UserRole requestedRole) {
        UserRole normalizedRole = requestedRole == null ? UserRole.RESIDENT : requestedRole;
        if (principal.getRole() == UserRole.ADMIN) {
            return normalizedRole;
        }
        if (!communityAccessService.isCurrentCommunityAdmin(principal)) {
            throw new IllegalArgumentException("User cannot manage resident roles");
        }
        if (normalizedRole == UserRole.ADMIN || normalizedRole == UserRole.HOA_ADMIN) {
            throw new IllegalArgumentException("Only system admins can assign HOA admin or admin roles");
        }
        return normalizedRole;
    }

    private String generateUniqueInvitationToken() {
        String token;
        do {
            token = java.util.UUID.randomUUID().toString().replace("-", "");
        } while (residentInvitationRepository.existsByInvitationToken(token));
        return token;
    }

    private boolean currentCommunityAdminFor(AppUserPrincipal principal, Long residentId) {
        return residentCommunityMembershipRepository.findByResidentIdAndCommunityId(
                        residentId,
                        communityAccessService.requireCommunityIdForPrincipal(principal)
                )
                .map(ResidentCommunityMembershipEntity::isCommunityAdmin)
                .orElse(false);
    }

    private boolean normalizeCommunityAdminAssignment(
            AppUserPrincipal principal,
            UserRole requestedRole,
            Boolean requestedCommunityAdmin,
            boolean existingCommunityAdmin
    ) {
        if (requestedRole == UserRole.ADMIN || requestedRole == UserRole.HOA_ADMIN) {
            return true;
        }
        if (requestedCommunityAdmin == null) {
            return existingCommunityAdmin;
        }
        if (principal.getRole() == UserRole.ADMIN) {
            return requestedCommunityAdmin;
        }
        if (!communityAccessService.isCurrentCommunityAdmin(principal)) {
            throw new IllegalArgumentException("User cannot manage resident roles");
        }
        return requestedCommunityAdmin;
    }

    private CommunityMembershipResponse toCommunityMembershipResponse(ResidentCommunityMembershipEntity membership, boolean active) {
        return new CommunityMembershipResponse(
                membership.getCommunity().getId(),
                membership.getCommunity().getSlug(),
                membership.getCommunity().getName(),
                active,
                membership.isCommunityAdmin()
        );
    }
}
