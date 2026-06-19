package com.chatplatform.core.controller;

import com.chatplatform.core.dto.ApiResponse;
import com.chatplatform.core.dto.auth.LoginRequest;
import com.chatplatform.core.dto.auth.RegisterRequest;
import com.chatplatform.core.dto.auth.TokenResponse;
import com.chatplatform.core.entity.User;
import com.chatplatform.core.service.AuthService;
import com.chatplatform.core.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    /** POST /api/v1/auth/register */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<TokenResponse>> register(
            @Valid @RequestBody RegisterRequest req) {

        userService.register(req.getFullName(), req.getEmail(),
                             req.getPassword(), req.getWorkspaceName());

        TokenResponse tokens = authService.login(req.getEmail(), req.getPassword());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(tokens));
    }

    /** POST /api/v1/auth/login */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(
            @Valid @RequestBody LoginRequest req) {

        TokenResponse tokens = authService.login(req.getEmail(), req.getPassword());
        return ResponseEntity.ok(ApiResponse.ok(tokens));
    }

    /** POST /api/v1/auth/refresh */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(
            @RequestBody Map<String, String> body) {

        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("MISSING_TOKEN", "refreshToken is required"));
        }
        return ResponseEntity.ok(ApiResponse.ok(authService.refresh(refreshToken)));
    }

    /** POST /api/v1/auth/forgot-password — placeholder, returns 200 always */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @RequestBody Map<String, String> body) {
        // TODO: send reset email via SMTP when email service is added
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
