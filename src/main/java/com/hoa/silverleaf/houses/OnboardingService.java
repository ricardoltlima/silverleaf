package com.hoa.silverleaf.houses;

import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.houses.dto.HouseResponse;
import com.hoa.silverleaf.houses.dto.OnboardingCompleteRequest;
import com.hoa.silverleaf.houses.dto.OnboardingContactRequest;
import com.hoa.silverleaf.houses.dto.OnboardingSessionResponse;
import com.hoa.silverleaf.houses.dto.OnboardingStartRequest;
import com.hoa.silverleaf.houses.onboarding.OnboardingSessionEntity;
import com.hoa.silverleaf.houses.onboarding.OnboardingSessionRepository;
import com.hoa.silverleaf.houses.onboarding.OnboardingStatus;
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

    public OnboardingService(
            HouseRepository houseRepository,
            HouseResidentRepository houseResidentRepository,
            OnboardingSessionRepository onboardingSessionRepository,
            HouseService houseService
    ) {
        this.houseRepository = houseRepository;
        this.houseResidentRepository = houseResidentRepository;
        this.onboardingSessionRepository = onboardingSessionRepository;
        this.houseService = houseService;
    }

    @Transactional
    public OnboardingSessionResponse start(OnboardingStartRequest request) {
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
    public OnboardingSessionResponse requestContactVerification(OnboardingContactRequest request) {
        OnboardingSessionEntity session = onboardingSessionRepository.findBySessionToken(request.sessionToken().trim())
                .orElseThrow(() -> new NotFoundException("Onboarding session not found"));

        if (session.getStatus() == OnboardingStatus.COMPLETED) {
            throw new IllegalArgumentException("Onboarding session already completed");
        }

        session.setContactType(request.contactType());
        session.setContactValue(request.contactValue().trim().toLowerCase(Locale.ROOT));
        session.setVerificationToken(generateUniqueVerificationToken());
        session.setVerificationExpiresAt(Instant.now().plus(30, ChronoUnit.MINUTES));
        session.setStatus(OnboardingStatus.CONTACT_PENDING);

        OnboardingSessionEntity saved = onboardingSessionRepository.save(session);
        log.info("Contact verification requested sessionToken={} type={}", saved.getSessionToken(), saved.getContactType());
        return toResponse(saved);
    }

    @Transactional
    public OnboardingSessionResponse verifyContact(String verificationToken) {
        OnboardingSessionEntity session = onboardingSessionRepository.findByVerificationToken(verificationToken.trim())
                .orElseThrow(() -> new NotFoundException("Verification token not found"));

        if (session.getStatus() != OnboardingStatus.CONTACT_PENDING) {
            throw new IllegalArgumentException("Verification is not pending for this session");
        }
        if (session.getVerificationExpiresAt() == null || session.getVerificationExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Verification token expired");
        }

        session.setVerifiedAt(Instant.now());
        session.setStatus(OnboardingStatus.CONTACT_VERIFIED);
        OnboardingSessionEntity saved = onboardingSessionRepository.save(session);
        log.info("Contact verified for sessionToken={}", saved.getSessionToken());
        return toResponse(saved);
    }

    @Transactional
    public HouseResponse complete(OnboardingCompleteRequest request) {
        OnboardingSessionEntity session = onboardingSessionRepository.findBySessionToken(request.sessionToken().trim())
                .orElseThrow(() -> new NotFoundException("Onboarding session not found"));

        if (session.getStatus() != OnboardingStatus.CONTACT_VERIFIED) {
            throw new IllegalArgumentException("Onboarding session is not verified");
        }

        HouseEntity house = session.getHouse();
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        if (houseResidentRepository.existsByHouseIdAndEmailIgnoreCase(house.getId(), normalizedEmail)) {
            throw new IllegalArgumentException("Resident already added to this address");
        }

        HouseResidentEntity resident = new HouseResidentEntity();
        resident.setHouse(house);
        resident.setFullName(request.fullName().trim());
        resident.setEmail(normalizedEmail);
        houseResidentRepository.save(resident);

        house.setStatus(HouseStatus.OCCUPIED);
        if (house.getClaimedAt() == null) {
            house.setClaimedAt(Instant.now());
        }
        houseRepository.save(house);

        session.setAuthProvider(request.provider().trim().toLowerCase(Locale.ROOT));
        session.setAuthSubject(request.providerSubject().trim());
        session.setStatus(OnboardingStatus.COMPLETED);
        session.setCompletedAt(Instant.now());
        onboardingSessionRepository.save(session);

        log.info("Onboarding completed sessionToken={} houseId={}", session.getSessionToken(), house.getId());
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
