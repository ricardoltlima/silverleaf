package com.hoa.silverleaf.security;

import com.hoa.silverleaf.users.UserEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Slf4j
@Service
public class JwtService {

    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    public String generateAccessToken(UserEntity user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(jwtProperties.getAccessTokenMinutes(), ChronoUnit.MINUTES);
        log.debug("Generating JWT access token userId={} role={} expiresAt={}",
                user.getId(), user.getRole(), expiresAt);
        return Jwts.builder()
                .issuer(jwtProperties.getIssuer())
                .subject(user.getId().toString())
                .claim("role", user.getRole().name())
                .claim("email", user.getEmail())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(secretKey())
                .compact();
    }

    public Claims parse(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        log.debug("JWT parsed subject={} issuer={} expiration={}",
                claims.getSubject(), claims.getIssuer(), claims.getExpiration());
        return claims;
    }

    private SecretKey secretKey() {
        byte[] secretBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            log.error("JWT secret length is too short length={} bytes", secretBytes.length);
            throw new IllegalStateException("JWT secret must be at least 32 characters");
        }
        return Keys.hmacShaKeyFor(secretBytes);
    }
}
