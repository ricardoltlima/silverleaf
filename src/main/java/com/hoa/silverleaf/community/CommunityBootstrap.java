package com.hoa.silverleaf.community;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class CommunityBootstrap implements ApplicationRunner {

    private final CommunityRepository communityRepository;

    public CommunityBootstrap(CommunityRepository communityRepository) {
        this.communityRepository = communityRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (communityRepository.findBySlug(CommunityService.DEFAULT_COMMUNITY_SLUG).isPresent()) {
            return;
        }

        CommunityEntity community = new CommunityEntity();
        community.setSlug(CommunityService.DEFAULT_COMMUNITY_SLUG);
        community.setName("Silverleaf Reserve");
        communityRepository.save(community);
    }
}
