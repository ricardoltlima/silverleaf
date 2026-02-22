package com.hoa.silverleaf.houses;

import com.hoa.silverleaf.houses.dto.HouseResponse;
import com.hoa.silverleaf.houses.dto.GoogleOnboardingCompleteRequest;
import com.hoa.silverleaf.houses.dto.GoogleOnboardingStartRequest;
import com.hoa.silverleaf.houses.dto.LocalOnboardingLoginRequest;
import com.hoa.silverleaf.houses.dto.LocalOnboardingLoginResponse;
import com.hoa.silverleaf.houses.dto.OnboardingCompleteRequest;
import com.hoa.silverleaf.houses.dto.OnboardingContactRequest;
import com.hoa.silverleaf.houses.dto.PublicConfigResponse;
import com.hoa.silverleaf.houses.dto.OnboardingSessionResponse;
import com.hoa.silverleaf.houses.dto.OnboardingStartRequest;
import com.hoa.silverleaf.houses.onboarding.OnboardingProperties;
import com.hoa.silverleaf.houses.onboarding.GoogleIdentityService;
import com.hoa.silverleaf.houses.onboarding.IdentityAssertion;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.servlet.view.RedirectView;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/public/onboarding")
public class OnboardingController {

    private final HouseService houseService;
    private final OnboardingService onboardingService;
    private final GoogleIdentityService googleIdentityService;
    private final OnboardingProperties onboardingProperties;

    public OnboardingController(
            HouseService houseService,
            OnboardingService onboardingService,
            GoogleIdentityService googleIdentityService,
            OnboardingProperties onboardingProperties
    ) {
        this.houseService = houseService;
        this.onboardingService = onboardingService;
        this.googleIdentityService = googleIdentityService;
        this.onboardingProperties = onboardingProperties;
    }

    @GetMapping("/houses/pending")
    public List<HouseResponse> pendingHouses() {
        log.info("Pending houses requested for onboarding");
        return houseService.listPendingHouses();
    }

    @GetMapping("/houses/{qrToken}")
    public HouseResponse houseByQrToken(@PathVariable String qrToken) {
        log.info("House lookup requested by qrToken");
        return houseService.getHouseByQrToken(qrToken);
    }

    @PostMapping("/start")
    public OnboardingSessionResponse start(@Valid @RequestBody OnboardingStartRequest request) {
        log.info("Onboarding start requested for houseId={}", request.houseId());
        return onboardingService.start(request);
    }

    @PostMapping("/contact")
    public OnboardingSessionResponse contact(@Valid @RequestBody OnboardingContactRequest request) {
        log.info("Onboarding contact verification requested");
        return onboardingService.requestContactVerification(request);
    }

    @GetMapping("/verify/{verificationToken}")
    public OnboardingSessionResponse verify(@PathVariable String verificationToken) {
        log.info("Onboarding verification callback requested");
        return onboardingService.verifyContact(verificationToken);
    }

    @GetMapping("/verify-web/{verificationToken}")
    public RedirectView verifyWeb(@PathVariable String verificationToken) {
        log.info("Onboarding web verification callback requested tokenPrefix={}",
                verificationToken.length() >= 8 ? verificationToken.substring(0, 8) : verificationToken);
        onboardingService.verifyContact(verificationToken);
        log.info("Onboarding web verification complete, redirecting to home page");
        return new RedirectView("/");
    }

    @PostMapping("/complete")
    public HouseResponse complete(@Valid @RequestBody OnboardingCompleteRequest request) {
        log.info("Onboarding completion requested");
        return onboardingService.complete(request);
    }

    @PostMapping("/complete/google")
    public HouseResponse completeWithGoogle(@Valid @RequestBody GoogleOnboardingCompleteRequest request) {
        log.info("Google onboarding completion requested");
        IdentityAssertion identity = googleIdentityService.verify(request.idToken().trim());
        return onboardingService.completeWithIdentity(request.sessionToken().trim(), identity);
    }

    @PostMapping("/google/start")
    public OnboardingSessionResponse startWithGoogle(@Valid @RequestBody GoogleOnboardingStartRequest request) {
        log.info("Google onboarding start requested for houseId={}", request.houseId());
        IdentityAssertion identity = googleIdentityService.verify(request.idToken().trim());
        return onboardingService.startWithGoogleIdentity(request.houseId(), identity);
    }

    @GetMapping("/config")
    public PublicConfigResponse publicConfig() {
        log.debug("Onboarding public config requested localLoginEnabled={} googleConfigured={}",
                onboardingProperties.isLocalLoginEnabled(),
                onboardingProperties.getGoogle().getClientId() != null
                        && !onboardingProperties.getGoogle().getClientId().isBlank());
        return new PublicConfigResponse(
                onboardingProperties.getGoogle().getClientId(),
                onboardingProperties.isLocalLoginEnabled()
        );
    }

    @PostMapping("/local/login-and-complete")
    public LocalOnboardingLoginResponse localLoginAndComplete(@Valid @RequestBody LocalOnboardingLoginRequest request) {
        log.info("Local login onboarding requested for houseId={}", request.houseId());
        return onboardingService.localLoginAndComplete(request.houseId(), request.email(), request.password());
    }
}
