package com.chatplatform.core.service;

import com.chatplatform.core.dto.auth.TokenResponse;
import com.chatplatform.core.entity.Tenant;
import com.chatplatform.core.entity.TenantMember;
import com.chatplatform.core.entity.User;
import com.chatplatform.core.exception.BusinessException;
import com.chatplatform.core.repository.TenantMemberRepository;
import com.chatplatform.core.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final TenantMemberRepository memberRepo;
    private final JwtService jwtService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public String hashPassword(String raw) {
        return passwordEncoder.encode(raw);
    }

    public boolean verifyPassword(String raw, String hash) {
        return passwordEncoder.matches(raw, hash);
    }

    /**
     * Validate credentials and return JWT tokens.
     */
    public TokenResponse login(String email, String password) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new BusinessException("LOGIN_FAILED",
                        "Invalid email or password", HttpStatus.UNAUTHORIZED));

        if (user.getPasswordHash() == null || !verifyPassword(password, user.getPasswordHash())) {
            throw new BusinessException("LOGIN_FAILED",
                    "Invalid email or password", HttpStatus.UNAUTHORIZED);
        }

        if ("suspended".equals(user.getStatus())) {
            throw new BusinessException("ACCOUNT_SUSPENDED",
                    "Your account has been suspended", HttpStatus.FORBIDDEN);
        }

        return buildTokens(user);
    }

    /**
     * Issue new access token from a valid refresh token.
     */
    public TokenResponse refresh(String refreshToken) {
        UUID userId;
        try {
            userId = jwtService.getUserIdFromRefreshToken(refreshToken);
        } catch (Exception e) {
            throw new BusinessException("INVALID_TOKEN",
                    "Session expired, please log in again", HttpStatus.UNAUTHORIZED);
        }

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new BusinessException("INVALID_TOKEN",
                        "User not found", HttpStatus.UNAUTHORIZED));

        return buildTokens(user);
    }

    // ── Private ──────────────────────────────────────────────────

    private TokenResponse buildTokens(User user) {
        // Find the user's primary tenant + role
        UUID tenantId = null;
        List<String> roles = List.of("tenant:member");

        List<TenantMember> memberships = memberRepo.findByUserId(user.getId());
        if (!memberships.isEmpty()) {
            TenantMember primary = memberships.get(0);
            tenantId = primary.getTenantId();
            roles = List.of(primary.getRole());
        }

        String access  = jwtService.generateAccessToken(user, tenantId, roles);
        String refresh = jwtService.generateRefreshToken(user.getId());

        TokenResponse resp = new TokenResponse();
        resp.setAccessToken(access);
        resp.setRefreshToken(refresh);
        resp.setExpiresIn(3600);
        resp.setTokenType("Bearer");
        resp.setUser(new TokenResponse.UserInfo(
                user.getId().toString(), user.getEmail(), user.getFullName()));
        return resp;
    }
}
