package com.hoa.silverleaf.auth;

import com.hoa.silverleaf.auth.dto.AuthRequest;
import com.hoa.silverleaf.auth.dto.AuthResponse;
import com.hoa.silverleaf.auth.dto.RefreshRequest;
import com.hoa.silverleaf.auth.dto.RegisterRequest;
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
        log.info("Register request received for email={}", request.email());
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        log.info("Login request received for email={}", request.email());
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        log.info("Refresh token request received");
        return authService.refresh(request);
    }
}
