package com.chatplatform.core.service;

import com.chatplatform.core.entity.Tenant;
import com.chatplatform.core.entity.User;
import com.chatplatform.core.exception.BusinessException;
import com.chatplatform.core.exception.ResourceNotFoundException;
import com.chatplatform.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepo;
    private final AuthService authService;
    private final TenantService tenantService;

    @Transactional
    public User register(String fullName, String email, String password, String workspaceName) {
        if (userRepo.existsByEmail(email)) {
            throw new BusinessException("EMAIL_TAKEN", "An account with this email already exists");
        }

        User user = User.builder()
                .email(email)
                .fullName(fullName)
                .passwordHash(authService.hashPassword(password))
                .build();
        user = userRepo.save(user);

        tenantService.createTenant(workspaceName, email, user);

        log.info("Registered user {} with workspace '{}'", email, workspaceName);
        return user;
    }

    @Transactional
    public User touchLastLogin(UUID userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        user.setLastLoginAt(Instant.now());
        return userRepo.save(user);
    }

    public User getById(UUID userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }

    public User getCurrentUser(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return getById(userId);
    }

    @Transactional
    public User updateProfile(UUID userId, String fullName, String avatarUrl) {
        User user = getById(userId);
        if (fullName != null)  user.setFullName(fullName);
        if (avatarUrl != null) user.setAvatarUrl(avatarUrl);
        return userRepo.save(user);
    }
}
