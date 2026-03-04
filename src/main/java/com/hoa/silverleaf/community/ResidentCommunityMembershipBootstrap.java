package com.hoa.silverleaf.community;

import com.hoa.silverleaf.users.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ResidentCommunityMembershipBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final ResidentCommunityMembershipService residentCommunityMembershipService;

    public ResidentCommunityMembershipBootstrap(
            UserRepository userRepository,
            ResidentCommunityMembershipService residentCommunityMembershipService
    ) {
        this.userRepository = userRepository;
        this.residentCommunityMembershipService = residentCommunityMembershipService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        userRepository.findAll().forEach(user -> {
            if (residentCommunityMembershipService.hasActiveMembership(user.getId())) {
                return;
            }
            residentCommunityMembershipService.ensureDefaultMembership(user);
        });
    }
}
