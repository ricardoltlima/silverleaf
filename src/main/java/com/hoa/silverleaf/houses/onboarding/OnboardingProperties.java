package com.hoa.silverleaf.houses.onboarding;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.onboarding")
public class OnboardingProperties {

    private String verificationBaseUrl;
    private String residentInviteBaseUrl;
    private boolean localLoginEnabled;
    private Notification notification = new Notification();
    private Google google = new Google();

    public String getVerificationBaseUrl() {
        return verificationBaseUrl;
    }

    public void setVerificationBaseUrl(String verificationBaseUrl) {
        this.verificationBaseUrl = verificationBaseUrl;
    }

    public boolean isLocalLoginEnabled() {
        return localLoginEnabled;
    }

    public void setLocalLoginEnabled(boolean localLoginEnabled) {
        this.localLoginEnabled = localLoginEnabled;
    }

    public String getResidentInviteBaseUrl() {
        return residentInviteBaseUrl;
    }

    public void setResidentInviteBaseUrl(String residentInviteBaseUrl) {
        this.residentInviteBaseUrl = residentInviteBaseUrl;
    }

    public Notification getNotification() {
        return notification;
    }

    public void setNotification(Notification notification) {
        this.notification = notification;
    }

    public Google getGoogle() {
        return google;
    }

    public void setGoogle(Google google) {
        this.google = google;
    }

    public static class Notification {
        private String fromEmail;
        private boolean emailEnabled;

        public String getFromEmail() {
            return fromEmail;
        }

        public void setFromEmail(String fromEmail) {
            this.fromEmail = fromEmail;
        }

        public boolean isEmailEnabled() {
            return emailEnabled;
        }

        public void setEmailEnabled(boolean emailEnabled) {
            this.emailEnabled = emailEnabled;
        }
    }

    public static class Google {
        private String clientId;

        public String getClientId() {
            return clientId;
        }

        public void setClientId(String clientId) {
            this.clientId = clientId;
        }
    }
}
