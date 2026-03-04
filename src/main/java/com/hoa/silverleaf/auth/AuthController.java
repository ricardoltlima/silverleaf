package com.hoa.silverleaf.auth;

import com.hoa.silverleaf.auth.dto.AuthRequest;
import com.hoa.silverleaf.auth.dto.AuthResponse;
import com.hoa.silverleaf.auth.dto.RefreshRequest;
import com.hoa.silverleaf.auth.dto.RegisterRequest;
import com.hoa.silverleaf.auth.dto.SwitchCommunityRequest;
import com.hoa.silverleaf.security.AppUserPrincipal;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping
    public String getMyResponse() {
        log.debug("Auth test endpoint called");
        return "Hello World";
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        log.info("Register request received emailLength={}", request.email() == null ? 0 : request.email().length());
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        log.info("Login request received emailLength={}", request.email() == null ? 0 : request.email().length());
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        log.info("Refresh token request received");
        return authService.refresh(request);
    }

    @PostMapping("/switch-community")
    public AuthResponse switchCommunity(
            @org.springframework.security.core.annotation.AuthenticationPrincipal AppUserPrincipal principal,
            @Valid @RequestBody SwitchCommunityRequest request
    ) {
        log.info("Switch community request received userId={} communityId={}", principal.getId(), request.communityId());
        return authService.switchCommunity(principal, request);
    }
}
