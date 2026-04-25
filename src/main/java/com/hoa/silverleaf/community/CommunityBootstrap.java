package com.hoa.silverleaf.community;

import com.hoa.silverleaf.users.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
public class CommunityBootstrap implements ApplicationRunner {

    private final CommunityRepository communityRepository;
    private final UserRepository userRepository;
    private final ResidentCommunityMembershipService residentCommunityMembershipService;

    public CommunityBootstrap(
            CommunityRepository communityRepository,
            UserRepository userRepository,
            ResidentCommunityMembershipService residentCommunityMembershipService
    ) {
        this.communityRepository = communityRepository;
        this.userRepository = userRepository;
        this.residentCommunityMembershipService = residentCommunityMembershipService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        CommunityEntity firstActiveCommunity = communityRepository.findFirstByActiveTrueOrderByCreatedAtAsc()
                .orElse(null);
        if (firstActiveCommunity == null) {
            log.warn("Skipping resident community backfill because no active community exists");
            return;
        }

        userRepository.findAll().forEach(user -> {
            if (residentCommunityMembershipService.hasActiveMembership(user.getId())) {
                return;
            }
            residentCommunityMembershipService.activateMembership(user, firstActiveCommunity);
        });
    }
}
