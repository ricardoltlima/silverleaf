package com.hoa.silverleaf.houses;

import com.hoa.silverleaf.houses.dto.HouseResponse;
import com.hoa.silverleaf.houses.dto.OnboardingCompleteRequest;
import com.hoa.silverleaf.houses.dto.OnboardingContactRequest;
import com.hoa.silverleaf.houses.dto.OnboardingSessionResponse;
import com.hoa.silverleaf.houses.dto.OnboardingStartRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
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

    public OnboardingController(HouseService houseService, OnboardingService onboardingService) {
        this.houseService = houseService;
        this.onboardingService = onboardingService;
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

    @PostMapping("/complete")
    public HouseResponse complete(@Valid @RequestBody OnboardingCompleteRequest request) {
        log.info("Onboarding completion requested");
        return onboardingService.complete(request);
    }
}
