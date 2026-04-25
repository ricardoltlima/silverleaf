package com.hoa.silverleaf.community;

import com.hoa.silverleaf.common.NotFoundException;
import com.hoa.silverleaf.community.dto.CommunityConfigResponse;
import com.hoa.silverleaf.community.dto.CommunityResponse;
import com.hoa.silverleaf.community.dto.CreateCommunityRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class CommunityService {

    private final CommunityRepository communityRepository;

    public CommunityService(CommunityRepository communityRepository) {
        this.communityRepository = communityRepository;
    }

    @Transactional(readOnly = true)
    public Optional<CommunityEntity> findFirstActiveCommunity() {
        return communityRepository.findFirstByActiveTrueOrderByCreatedAtAsc();
    }

    @Transactional(readOnly = true)
    public CommunityEntity requireFirstActiveCommunity() {
        return findFirstActiveCommunity()
                .orElseThrow(() -> new NotFoundException("No active community found"));
    }

    @Transactional(readOnly = true)
    public CommunityConfigResponse getPublicCommunityConfig(String slug) {
        String normalizedSlug = normalizeSlug(slug);
        CommunityEntity community = communityRepository.findBySlug(normalizedSlug)
                .filter(CommunityEntity::isActive)
                .orElseThrow(() -> new NotFoundException("Community not found"));
        return new CommunityConfigResponse(
                community.getName(),
                community.getSlug(),
                community.getLogoUrl(),
                community.getPrimaryColor(),
                community.getCity(),
                community.getState(),
                community.getTimezone()
        );
    }

    @Transactional
    public CommunityResponse createCommunity(CreateCommunityRequest request) {
        String normalizedSlug = normalizeSlug(request.slug());
        if (communityRepository.findBySlug(normalizedSlug).isPresent()) {
            throw new IllegalArgumentException("Community slug already exists");
        }

        CommunityEntity community = new CommunityEntity();
        community.setName(requireText(request.name(), "Community name is required"));
        community.setSlug(normalizedSlug);
        community.setCity(trimToNull(request.city()));
        community.setState(trimToNull(request.state()));
        community.setZipCode(trimToNull(request.zipCode()));
        community.setContactEmail(trimToNull(request.contactEmail()));
        community.setLogoUrl(trimToNull(request.logoUrl()));
        community.setPrimaryColor(trimToNull(request.primaryColor()));
        community.setActive(true);
        community.setTimezone(defaultTimezone(request.timezone()));

        return toResponse(communityRepository.save(community));
    }

    @Transactional(readOnly = true)
    public List<CommunityResponse> listAllCommunities() {
        return communityRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    private CommunityResponse toResponse(CommunityEntity community) {
        return new CommunityResponse(
                community.getId(),
                community.getName(),
                community.getSlug(),
                community.getCity(),
                community.getState(),
                community.getZipCode(),
                community.getContactEmail(),
                community.getLogoUrl(),
                community.getPrimaryColor(),
                community.getTimezone(),
                community.isActive(),
                LocalDateTime.ofInstant(community.getCreatedAt(), ZoneId.systemDefault())
        );
    }

    private String normalizeSlug(String slug) {
        String normalized = requireText(slug, "Community slug is required")
                .toLowerCase(Locale.ROOT);
        return normalized;
    }

    private String requireText(String value, String message) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new IllegalArgumentException(message);
        }
        return trimmed;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String defaultTimezone(String timezone) {
        return trimToNull(timezone) == null ? "America/New_York" : timezone.trim();
    }
}
