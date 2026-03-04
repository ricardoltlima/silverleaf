package com.hoa.silverleaf.auth;

import com.hoa.silverleaf.auth.dto.AuthRequest;
import com.hoa.silverleaf.auth.dto.AuthResponse;
import com.hoa.silverleaf.auth.dto.RefreshRequest;
import com.hoa.silverleaf.auth.dto.RegisterRequest;
import com.hoa.silverleaf.auth.dto.SwitchCommunityRequest;
import com.hoa.silverleaf.community.CommunityEntity;
import com.hoa.silverleaf.community.CommunityAccessService;
import com.hoa.silverleaf.community.CommunityRepository;
import com.hoa.silverleaf.community.ResidentCommunityMembershipRepository;
import com.hoa.silverleaf.community.ResidentCommunityMembershipService;
import com.hoa.silverleaf.security.AppUserPrincipal;
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
    private final ResidentCommunityMembershipService residentCommunityMembershipService;
    private final CommunityAccessService communityAccessService;
    private final CommunityRepository communityRepository;
    private final ResidentCommunityMembershipRepository residentCommunityMembershipRepository;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            AuthenticationManager authenticationManager,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties,
            ResidentCommunityMembershipService residentCommunityMembershipService,
            CommunityAccessService communityAccessService,
            CommunityRepository communityRepository,
            ResidentCommunityMembershipRepository residentCommunityMembershipRepository
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.residentCommunityMembershipService = residentCommunityMembershipService;
        this.communityAccessService = communityAccessService;
        this.communityRepository = communityRepository;
        this.residentCommunityMembershipRepository = residentCommunityMembershipRepository;
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
        residentCommunityMembershipService.ensureDefaultMembership(savedUser);
        log.info("User registered successfully. userId={}, email={}", savedUser.getId(), savedUser.getEmail());

        return issueTokens(savedUser, communityAccessService.requireCommunityForUser(savedUser.getId()));
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        // Authentication is delegated to Spring Security so account lock/disable rules stay centralized.
        log.debug("Authenticating user email={}", normalizedEmail);
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
        );

        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        log.info("User authenticated successfully. userId={}, email={}", user.getId(), user.getEmail());

        return issueTokens(user, communityAccessService.requireCommunityForUser(user.getId()));
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        log.debug("Refreshing access token refreshTokenLength={}", request.refreshToken() == null ? 0 : request.refreshToken().length());
        RefreshTokenEntity token = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));
        if (token.isRevoked() || token.getExpiresAt().isBefore(Instant.now())) {
            log.warn("Refresh token rejected for userId={}", token.getUser().getId());
            throw new IllegalArgumentException("Refresh token expired or revoked");
        }

        token.setRevoked(true);
        refreshTokenRepository.save(token);
        // Opportunistic cleanup keeps token table compact without a separate scheduled job.
        refreshTokenRepository.deleteByExpiresAtBeforeOrRevokedIsTrue(Instant.now());
        log.info("Refresh token rotated for userId={}", token.getUser().getId());

        return issueTokens(token.getUser(), token.getActiveCommunity());
    }

    @Transactional
    public AuthResponse switchCommunity(AppUserPrincipal principal, SwitchCommunityRequest request) {
        CommunityEntity targetCommunity = communityRepository.findById(request.communityId())
                .orElseThrow(() -> new IllegalArgumentException("Community not found"));
        if (!residentCommunityMembershipRepository.existsByResidentIdAndCommunityIdAndActiveTrue(principal.getId(), targetCommunity.getId())) {
            throw new IllegalArgumentException("Community is not available for this resident");
        }

        RefreshTokenEntity currentToken = refreshTokenRepository.findByToken(request.refreshToken().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));
        if (!currentToken.getUser().getId().equals(principal.getId()) || currentToken.isRevoked()) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        currentToken.setRevoked(true);
        refreshTokenRepository.save(currentToken);

        UserEntity user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return issueTokens(user, targetCommunity);
    }

    private AuthResponse issueTokens(UserEntity user, CommunityEntity activeCommunity) {
        Instant accessExpiresAt = Instant.now().plus(jwtProperties.getAccessTokenMinutes(), ChronoUnit.MINUTES);
        String accessToken = jwtService.generateAccessToken(user, activeCommunity);
        String refreshToken = UUID.randomUUID().toString().replace("-", "");

        RefreshTokenEntity refreshTokenEntity = new RefreshTokenEntity();
        refreshTokenEntity.setToken(refreshToken);
        refreshTokenEntity.setUser(user);
        refreshTokenEntity.setActiveCommunity(activeCommunity);
        refreshTokenEntity.setExpiresAt(Instant.now().plus(jwtProperties.getRefreshTokenDays(), ChronoUnit.DAYS));
        refreshTokenRepository.save(refreshTokenEntity);
        log.debug("Tokens issued for userId={} with access expiry={}", user.getId(), accessExpiresAt);

        return new AuthResponse(
                accessToken,
                refreshToken,
                accessExpiresAt,
                activeCommunity.getId(),
                activeCommunity.getSlug(),
                activeCommunity.getName()
        );
    }
}
