package com.hoa.silverleaf.houses.onboarding;

public record IdentityAssertion(
        String provider,
        String providerSubject,
        String fullName,
        String email
) {
}
