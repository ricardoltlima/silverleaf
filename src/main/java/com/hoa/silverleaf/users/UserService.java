package com.hoa.silverleaf.users;

import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.security.AppUserPrincipal;
import com.hoa.silverleaf.users.dto.CreateResidentRequest;
import com.hoa.silverleaf.users.dto.MeResponse;
import com.hoa.silverleaf.users.dto.ResidentResponse;
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

import java.util.Locale;

@Slf4j
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public MeResponse me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserPrincipal principal)) {
            log.warn("Me endpoint called without authenticated principal");
            throw new IllegalArgumentException("Not authenticated");
        }
        log.debug("Authenticated principal resolved. userId={}, email={}", principal.getId(), principal.getUsername());
        return new MeResponse(
                principal.getId(),
                principal.getUsername(),
                principal.getFullName(),
                principal.getRole()
        );
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
}
