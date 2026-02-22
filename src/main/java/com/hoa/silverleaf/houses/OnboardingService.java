package com.hoa.silverleaf.houses;

import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.auth.AuthService;
import com.hoa.silverleaf.auth.dto.AuthRequest;
import com.hoa.silverleaf.auth.dto.AuthResponse;
import com.hoa.silverleaf.houses.dto.HouseResponse;
import com.hoa.silverleaf.houses.dto.LocalOnboardingLoginResponse;
import com.hoa.silverleaf.houses.dto.OnboardingCompleteRequest;
import com.hoa.silverleaf.houses.dto.OnboardingContactRequest;
import com.hoa.silverleaf.houses.dto.OnboardingSessionResponse;
import com.hoa.silverleaf.houses.dto.OnboardingStartRequest;
import com.hoa.silverleaf.houses.onboarding.ContactType;
import com.hoa.silverleaf.houses.onboarding.OnboardingSessionEntity;
import com.hoa.silverleaf.houses.onboarding.OnboardingNotificationService;
import com.hoa.silverleaf.houses.onboarding.OnboardingProperties;
import com.hoa.silverleaf.houses.onboarding.OnboardingSessionRepository;
import com.hoa.silverleaf.houses.onboarding.OnboardingStatus;
import com.hoa.silverleaf.houses.onboarding.IdentityAssertion;
import com.hoa.silverleaf.users.UserEntity;
import com.hoa.silverleaf.users.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
public class OnboardingService {

    private final HouseRepository houseRepository;
    private final HouseResidentRepository houseResidentRepository;
    private final OnboardingSessionRepository onboardingSessionRepository;
    private final HouseService houseService;
    private final OnboardingNotificationService onboardingNotificationService;
    private final OnboardingProperties onboardingProperties;
    private final AuthService authService;
    private final UserRepository userRepository;

    public OnboardingService(
            HouseRepository houseRepository,
            HouseResidentRepository houseResidentRepository,
            OnboardingSessionRepository onboardingSessionRepository,
            HouseService houseService,
            OnboardingNotificationService onboardingNotificationService,
            OnboardingProperties onboardingProperties,
            AuthService authService,
            UserRepository userRepository
    ) {
        this.houseRepository = houseRepository;
        this.houseResidentRepository = houseResidentRepository;
        this.onboardingSessionRepository = onboardingSessionRepository;
        this.houseService = houseService;
        this.onboardingNotificationService = onboardingNotificationService;
        this.onboardingProperties = onboardingProperties;
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @Transactional
    public OnboardingSessionResponse start(OnboardingStartRequest request) {
        // Entry point for manual onboarding flow (contact verification happens in a later step).
        HouseEntity house = houseRepository.findById(request.houseId())
                .orElseThrow(() -> new NotFoundException("House not found"));

        OnboardingSessionEntity session = new OnboardingSessionEntity();
        session.setSessionToken(generateUniqueSessionToken());
        session.setHouse(house);
        session.setStatus(OnboardingStatus.STARTED);
        OnboardingSessionEntity saved = onboardingSessionRepository.save(session);
        log.info("Onboarding started sessionToken={} houseId={}", saved.getSessionToken(), house.getId());
        return toResponse(saved);
    }

    @Transactional
    public OnboardingSessionResponse startWithGoogleIdentity(Long houseId, IdentityAssertion identity) {
        // Optimized flow for browser onboarding: verify Google first, then request ownership confirmation via email.
        HouseEntity house = houseRepository.findById(houseId)
                .orElseThrow(() -> new NotFoundException("House not found"));

        OnboardingSessionEntity session = new OnboardingSessionEntity();
        session.setSessionToken(generateUniqueSessionToken());
        session.setHouse(house);
        session.setStatus(OnboardingStatus.STARTED);
        session.setPendingProvider(identity.provider().trim().toLowerCase(Locale.ROOT));
        session.setPendingSubject(identity.providerSubject().trim());
        session.setPendingFullName(identity.fullName().trim());
        session.setPendingEmail(identity.email().trim().toLowerCase(Locale.ROOT));

        session.setContactType(ContactType.EMAIL);
        session.setContactValue(session.getPendingEmail());
        session.setVerificationToken(generateUniqueVerificationToken());
        session.setVerificationExpiresAt(Instant.now().plus(30, ChronoUnit.MINUTES));
        session.setStatus(OnboardingStatus.CONTACT_PENDING);

        OnboardingSessionEntity saved = onboardingSessionRepository.save(session);
        onboardingNotificationService.sendVerificationLink(
                saved.getContactType(),
                saved.getContactValue(),
                saved.getVerificationToken()
        );
        log.info("Google onboarding started sessionToken={} houseId={} email={}",
                saved.getSessionToken(), house.getId(), saved.getContactValue());
        return toResponse(saved);
    }

    @Transactional
    public OnboardingSessionResponse requestContactVerification(OnboardingContactRequest request) {
        OnboardingSessionEntity session = onboardingSessionRepository.findBySessionToken(request.sessionToken().trim())
                .orElseThrow(() -> new NotFoundException("Onboarding session not found"));

        if (session.getStatus() == OnboardingStatus.COMPLETED) {
            log.warn("Contact verification requested for already completed sessionToken={}", session.getSessionToken());
            throw new IllegalArgumentException("Onboarding session already completed");
        }

        session.setContactType(request.contactType());
        session.setContactValue(request.contactValue().trim().toLowerCase(Locale.ROOT));
        session.setVerificationToken(generateUniqueVerificationToken());
        session.setVerificationExpiresAt(Instant.now().plus(30, ChronoUnit.MINUTES));
        session.setStatus(OnboardingStatus.CONTACT_PENDING);

        OnboardingSessionEntity saved = onboardingSessionRepository.save(session);
        onboardingNotificationService.sendVerificationLink(
                saved.getContactType(),
                saved.getContactValue(),
                saved.getVerificationToken()
        );
        log.info("Contact verification requested sessionToken={} type={} destination={}",
                saved.getSessionToken(), saved.getContactType(), saved.getContactValue());
        return toResponse(saved);
    }

    @Transactional
    public OnboardingSessionResponse verifyContact(String verificationToken) {
        OnboardingSessionEntity session = onboardingSessionRepository.findByVerificationToken(verificationToken.trim())
                .orElseThrow(() -> new NotFoundException("Verification token not found"));

        if (session.getStatus() != OnboardingStatus.CONTACT_PENDING) {
            log.warn("Verification attempted with invalid status sessionToken={} status={}",
                    session.getSessionToken(), session.getStatus());
            throw new IllegalArgumentException("Verification is not pending for this session");
        }
        if (session.getVerificationExpiresAt() == null || session.getVerificationExpiresAt().isBefore(Instant.now())) {
            log.warn("Verification token expired sessionToken={} expiresAt={}",
                    session.getSessionToken(), session.getVerificationExpiresAt());
            throw new IllegalArgumentException("Verification token expired");
        }

        session.setVerifiedAt(Instant.now());
        session.setStatus(OnboardingStatus.CONTACT_VERIFIED);
        OnboardingSessionEntity saved = onboardingSessionRepository.save(session);
        log.info("Contact verified for sessionToken={}", saved.getSessionToken());

        if (saved.getPendingProvider() != null
                && saved.getPendingSubject() != null
                && saved.getPendingEmail() != null) {
            HouseResponse completed = completeWithIdentity(saved.getSessionToken(), new IdentityAssertion(
                    saved.getPendingProvider(),
                    saved.getPendingSubject(),
                    saved.getPendingFullName() == null || saved.getPendingFullName().isBlank() ? "Resident" : saved.getPendingFullName(),
                    saved.getPendingEmail()
            ));
            log.info("Verification auto-completed onboarding for houseId={}", completed.id());
            return onboardingSessionRepository.findById(saved.getId())
                    .map(this::toResponse)
                    .orElseThrow(() -> new NotFoundException("Onboarding session not found after completion"));
        }

        return toResponse(saved);
    }

    @Transactional
    public HouseResponse complete(OnboardingCompleteRequest request) {
        return completeWithIdentity(
                request.sessionToken(),
                new IdentityAssertion(
                        request.provider().trim().toLowerCase(Locale.ROOT),
                        request.providerSubject().trim(),
                        request.fullName().trim(),
                        request.email().trim().toLowerCase(Locale.ROOT)
                )
        );
    }

    @Transactional
    public LocalOnboardingLoginResponse localLoginAndComplete(Long houseId, String email, String password) {
        if (!onboardingProperties.isLocalLoginEnabled()) {
            log.warn("Local login onboarding attempted while disabled houseId={}", houseId);
            throw new IllegalArgumentException("Local login onboarding is disabled for this environment");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        log.info("Local onboarding login requested houseId={} email={}", houseId, normalizedEmail);
        AuthResponse authResponse = authService.login(new AuthRequest(normalizedEmail, password));
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        HouseEntity house = houseRepository.findById(houseId)
                .orElseThrow(() -> new NotFoundException("House not found"));

        OnboardingSessionEntity session = new OnboardingSessionEntity();
        session.setSessionToken(generateUniqueSessionToken());
        session.setHouse(house);
        session.setStatus(OnboardingStatus.CONTACT_VERIFIED);
        session.setContactType(ContactType.EMAIL);
        session.setContactValue(normalizedEmail);
        session.setVerifiedAt(Instant.now());
        OnboardingSessionEntity saved = onboardingSessionRepository.save(session);

        HouseResponse houseResponse = completeWithIdentity(saved.getSessionToken(), new IdentityAssertion(
                "local",
                "user:" + user.getId(),
                user.getFullName(),
                user.getEmail()
        ));
        log.info("Local onboarding login completed houseId={} userId={}", houseId, user.getId());

        return new LocalOnboardingLoginResponse(authResponse, houseResponse);
    }

    @Transactional
    public HouseResponse completeWithIdentity(String sessionToken, IdentityAssertion identity) {
        OnboardingSessionEntity session = onboardingSessionRepository.findBySessionToken(sessionToken.trim())
                .orElseThrow(() -> new NotFoundException("Onboarding session not found"));

        if (session.getStatus() != OnboardingStatus.CONTACT_VERIFIED) {
            log.warn("Onboarding completion rejected sessionToken={} status={}",
                    session.getSessionToken(), session.getStatus());
            throw new IllegalArgumentException("Onboarding session is not verified");
        }

        HouseEntity house = session.getHouse();
        String normalizedEmail = identity.email().trim().toLowerCase(Locale.ROOT);
        if (houseResidentRepository.existsByHouseIdAndEmailIgnoreCase(house.getId(), normalizedEmail)) {
            log.warn("Duplicate resident claim blocked houseId={} email={}", house.getId(), normalizedEmail);
            throw new IllegalArgumentException("Resident already added to this address");
        }

        HouseResidentEntity resident = new HouseResidentEntity();
        resident.setHouse(house);
        resident.setFullName(identity.fullName().trim());
        resident.setEmail(normalizedEmail);
        houseResidentRepository.save(resident);

        house.setStatus(HouseStatus.OCCUPIED);
        if (house.getClaimedAt() == null) {
            house.setClaimedAt(Instant.now());
        }
        houseRepository.save(house);

        session.setAuthProvider(identity.provider().trim().toLowerCase(Locale.ROOT));
        session.setAuthSubject(identity.providerSubject().trim());
        session.setPendingProvider(null);
        session.setPendingSubject(null);
        session.setPendingFullName(null);
        session.setPendingEmail(null);
        session.setStatus(OnboardingStatus.COMPLETED);
        session.setCompletedAt(Instant.now());
        onboardingSessionRepository.save(session);

        log.info("Onboarding completed sessionToken={} houseId={} provider={} residentEmail={}",
                session.getSessionToken(), house.getId(), identity.provider(), normalizedEmail);
        return houseService.getHouseByQrToken(house.getQrToken());
    }

    private OnboardingSessionResponse toResponse(OnboardingSessionEntity session) {
        return new OnboardingSessionResponse(
                session.getSessionToken(),
                session.getHouse().getId(),
                session.getHouse().getAddress(),
                session.getStatus(),
                session.getStatus() == OnboardingStatus.CONTACT_VERIFIED || session.getStatus() == OnboardingStatus.COMPLETED,
                session.getVerificationToken(),
                session.getVerificationExpiresAt()
        );
    }

    private String generateUniqueSessionToken() {
        String token;
        do {
            token = UUID.randomUUID().toString().replace("-", "");
        } while (onboardingSessionRepository.existsBySessionToken(token));
        return token;
    }

    private String generateUniqueVerificationToken() {
        String token;
        do {
            token = UUID.randomUUID().toString().replace("-", "");
        } while (onboardingSessionRepository.existsByVerificationToken(token));
        return token;
    }
}
