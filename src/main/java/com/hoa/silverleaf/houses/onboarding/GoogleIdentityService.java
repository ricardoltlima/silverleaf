package com.hoa.silverleaf.houses.onboarding;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Slf4j
@Service
public class GoogleIdentityService {

    private final OnboardingProperties onboardingProperties;

    public GoogleIdentityService(OnboardingProperties onboardingProperties) {
        this.onboardingProperties = onboardingProperties;
    }

    public IdentityAssertion verify(String idTokenValue) {
        String clientId = onboardingProperties.getGoogle().getClientId();
        if (clientId == null || clientId.isBlank()) {
            log.error("Google token verification requested but GOOGLE_OAUTH_CLIENT_ID is missing");
            throw new IllegalStateException("GOOGLE_OAUTH_CLIENT_ID is not configured");
        }
        try {
            log.debug("Verifying Google ID token for configured audience");
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            ).setAudience(Collections.singletonList(clientId)).build();

            GoogleIdToken idToken = verifier.verify(idTokenValue);
            if (idToken == null) {
                log.warn("Google verifier returned null token");
                throw new IllegalArgumentException("Invalid Google ID token");
            }
            GoogleIdToken.Payload payload = idToken.getPayload();
            String sub = payload.getSubject();
            String email = payload.getEmail();
            Object nameObj = payload.get("name");
            String name = nameObj == null ? "Resident" : nameObj.toString();

            if (sub == null || sub.isBlank() || email == null || email.isBlank()) {
                log.warn("Google token missing required claim(s): subPresent={} emailPresent={}",
                        sub != null && !sub.isBlank(), email != null && !email.isBlank());
                throw new IllegalArgumentException("Google token missing required subject/email");
            }

            log.info("Google identity verified sub={} email={}", sub, email);
            return new IdentityAssertion("google", sub, name, email);
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Google token verification failed", ex);
            throw new IllegalArgumentException("Unable to verify Google token");
        }
    }
}
