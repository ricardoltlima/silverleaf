package com.hoa.silverleaf.security;

import com.hoa.silverleaf.users.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public AppUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading user details for principal={}", username);
        return userRepository.findByEmailIgnoreCase(username)
                .map(AppUserPrincipal::new)
                .orElseThrow(() -> {
                    log.warn("User details lookup failed principal={}", username);
                    return new UsernameNotFoundException("User not found");
                });
    }
}
