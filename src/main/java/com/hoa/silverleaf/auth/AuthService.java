package com.hoa.silverleaf.auth;

import com.hoa.silverleaf.auth.dto.AuthRequest;
import com.hoa.silverleaf.auth.dto.AuthResponse;
import com.hoa.silverleaf.auth.dto.RefreshRequest;
import com.hoa.silverleaf.auth.dto.RegisterRequest;
import com.hoa.silverleaf.security.JwtProperties;
import com.hoa.silverleaf.security.JwtService;
import com.hoa.silverleaf.users.UserEntity;
import com.hoa.silverleaf.users.UserRepository;
import com.hoa.silverleaf.users.UserRole;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            AuthenticationManager authenticationManager,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        log.debug("Attempting registration for email={}", normalizedEmail);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.warn("Registration rejected because email already exists: {}", normalizedEmail);
            throw new IllegalArgumentException("Email already registered");
        }

        UserEntity user = new UserEntity();
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.RESIDENT);
        UserEntity savedUser = userRepository.save(user);
        log.info("User registered successfully. userId={}, email={}", savedUser.getId(), savedUser.getEmail());

        return issueTokens(savedUser);
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        log.debug("Authenticating user email={}", normalizedEmail);
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
        );

        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        log.info("User authenticated successfully. userId={}, email={}", user.getId(), user.getEmail());

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        log.debug("Refreshing access token");
        RefreshTokenEntity token = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));
        if (token.isRevoked() || token.getExpiresAt().isBefore(Instant.now())) {
            log.warn("Refresh token rejected for userId={}", token.getUser().getId());
            throw new IllegalArgumentException("Refresh token expired or revoked");
        }

        token.setRevoked(true);
        refreshTokenRepository.save(token);
        refreshTokenRepository.deleteByExpiresAtBeforeOrRevokedIsTrue(Instant.now());
        log.info("Refresh token rotated for userId={}", token.getUser().getId());

        return issueTokens(token.getUser());
    }

    private AuthResponse issueTokens(UserEntity user) {
        Instant accessExpiresAt = Instant.now().plus(jwtProperties.getAccessTokenMinutes(), ChronoUnit.MINUTES);
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = UUID.randomUUID().toString().replace("-", "");

        RefreshTokenEntity refreshTokenEntity = new RefreshTokenEntity();
        refreshTokenEntity.setToken(refreshToken);
        refreshTokenEntity.setUser(user);
        refreshTokenEntity.setExpiresAt(Instant.now().plus(jwtProperties.getRefreshTokenDays(), ChronoUnit.DAYS));
        refreshTokenRepository.save(refreshTokenEntity);
        log.debug("Tokens issued for userId={} with access expiry={}", user.getId(), accessExpiresAt);

        return new AuthResponse(accessToken, refreshToken, accessExpiresAt);
    }
}
