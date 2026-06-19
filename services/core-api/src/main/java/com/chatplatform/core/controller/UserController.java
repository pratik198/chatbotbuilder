package com.chatplatform.core.controller;

import com.chatplatform.core.context.TenantContext;
import com.chatplatform.core.dto.ApiResponse;
import com.chatplatform.core.entity.User;
import com.chatplatform.core.service.TenantService;
import com.chatplatform.core.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final TenantService tenantService;

    /**
     * GET /api/v1/users/me
     * Returns the current user's profile.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMe(
            @AuthenticationPrincipal JwtAuthenticationToken jwt) {

        User user = userService.getCurrentUser(jwt);
        UUID tenantId = TenantContext.getTenantId();

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "id",          user.getId(),
                "email",       user.getEmail(),
                "fullName",    user.getFullName() != null ? user.getFullName() : "",
                "avatarUrl",   user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                "tenantId",    tenantId != null ? tenantId.toString() : ""
        )));
    }

    /**
     * PUT /api/v1/users/me
     * Update name or avatar.
     */
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateMe(
            @AuthenticationPrincipal JwtAuthenticationToken jwt,
            @RequestBody Map<String, String> body) {

        User user = userService.getCurrentUser(jwt);
        User updated = userService.updateProfile(user.getId(), body.get("fullName"), body.get("avatarUrl"));

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "id",        updated.getId(),
                "email",     updated.getEmail(),
                "fullName",  updated.getFullName() != null ? updated.getFullName() : "",
                "avatarUrl", updated.getAvatarUrl() != null ? updated.getAvatarUrl() : ""
        )));
    }
}
