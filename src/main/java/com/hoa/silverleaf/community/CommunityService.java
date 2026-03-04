package com.hoa.silverleaf.community;

import com.hoa.silverleaf.common.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommunityService {

    public static final String DEFAULT_COMMUNITY_SLUG = "silverleaf-reserve";

    private final CommunityRepository communityRepository;

    public CommunityService(CommunityRepository communityRepository) {
        this.communityRepository = communityRepository;
    }

    @Transactional(readOnly = true)
    public CommunityEntity requireDefaultCommunity() {
        return communityRepository.findBySlug(DEFAULT_COMMUNITY_SLUG)
                .orElseThrow(() -> new NotFoundException("Default community not found"));
    }
}
