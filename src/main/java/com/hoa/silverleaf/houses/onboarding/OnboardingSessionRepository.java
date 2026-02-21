package com.hoa.silverleaf.houses.onboarding;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OnboardingSessionRepository extends JpaRepository<OnboardingSessionEntity, Long> {
    Optional<OnboardingSessionEntity> findBySessionToken(String sessionToken);

    Optional<OnboardingSessionEntity> findByVerificationToken(String verificationToken);

    boolean existsBySessionToken(String sessionToken);

    boolean existsByVerificationToken(String verificationToken);
}
