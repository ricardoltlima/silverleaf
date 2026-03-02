package com.hoa.silverleaf.houses.onboarding;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class OnboardingNotificationService {

    private static final String DEFAULT_VERIFICATION_BASE_URL =
            "http://localhost:8080/api/v1/public/onboarding/verify-web";
    private static final String DEFAULT_RESIDENT_INVITE_BASE_URL =
            "http://localhost:8080/login";

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final OnboardingProperties onboardingProperties;

    public OnboardingNotificationService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            OnboardingProperties onboardingProperties
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.onboardingProperties = onboardingProperties;
    }

    public void sendVerificationLink(ContactType contactType, String destination, String verificationToken) {
        // A single method handles future multi-channel delivery; currently EMAIL and PHONE(logging-only).
        String verifyUrl = buildVerificationUrl(verificationToken);
        log.debug("Preparing verification notification type={} destination={}", contactType, destination);
        if (contactType == ContactType.EMAIL) {
            sendEmailVerification(destination, verifyUrl);
            return;
        }
        log.info("Phone verification requested but not integrated yet destination={} verifyUrl={}",
                destination, verifyUrl);
    }

    public void sendResidentInvitation(String destinationEmail, String fullName, String houseAddress, String invitationToken) {
        String inviteUrl = buildResidentInviteUrl(invitationToken);
        if (!onboardingProperties.getNotification().isEmailEnabled()) {
            log.info("Email sending disabled. Resident invite for {} at {} -> {}", destinationEmail, houseAddress, inviteUrl);
            return;
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.error("Email delivery enabled but JavaMailSender bean is unavailable");
            throw new IllegalStateException("Email is enabled but JavaMailSender is not configured");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(onboardingProperties.getNotification().getFromEmail());
        message.setTo(destinationEmail);
        message.setSubject("Silverleaf Reserve - Your resident invitation");
        message.setText("Hello " + fullName + ",\n\n"
                + "You have been invited to access Silverleaf Reserve for:\n"
                + houseAddress + "\n\n"
                + "Open this link to continue:\n"
                + inviteUrl);
        mailSender.send(message);
        log.info("Resident invitation email sent to {}", destinationEmail);
    }

    private void sendEmailVerification(String destinationEmail, String verifyUrl) {
        if (!onboardingProperties.getNotification().isEmailEnabled()) {
            log.info("Email sending disabled. Verification link for {} -> {}", destinationEmail, verifyUrl);
            return;
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.error("Email delivery enabled but JavaMailSender bean is unavailable");
            throw new IllegalStateException("Email is enabled but JavaMailSender is not configured");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(onboardingProperties.getNotification().getFromEmail());
        message.setTo(destinationEmail);
        message.setSubject("Silverleaf Reserve - Verify your contact");
        message.setText("Please verify your contact to continue onboarding:\n" + verifyUrl);
        log.debug("Dispatching verification email via configured SMTP provider");
        mailSender.send(message);
        log.info("Verification email sent to {}", destinationEmail);
    }

    private String buildVerificationUrl(String verificationToken) {
        String baseUrl = onboardingProperties.getVerificationBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            log.warn("app.onboarding.verification-base-url is blank. Falling back to default {}", DEFAULT_VERIFICATION_BASE_URL);
            baseUrl = DEFAULT_VERIFICATION_BASE_URL;
        }
        return baseUrl.endsWith("/")
                ? baseUrl + verificationToken
                : baseUrl + "/" + verificationToken;
    }

    public String buildResidentInviteUrl(String invitationToken) {
        String baseUrl = onboardingProperties.getResidentInviteBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            log.warn("app.onboarding.resident-invite-base-url is blank. Falling back to default {}", DEFAULT_RESIDENT_INVITE_BASE_URL);
            baseUrl = DEFAULT_RESIDENT_INVITE_BASE_URL;
        }
        String separator = baseUrl.contains("?") ? "&" : "?";
        return baseUrl + separator + "invite=" + invitationToken;
    }
}
