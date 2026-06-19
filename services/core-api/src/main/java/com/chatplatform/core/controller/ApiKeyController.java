package com.chatplatform.core.controller;

import com.chatplatform.core.context.TenantContext;
import com.chatplatform.core.dto.ApiResponse;
import com.chatplatform.core.entity.ApiKey;
import com.chatplatform.core.service.ApiKeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/api-keys")
@RequiredArgsConstructor
public class ApiKeyController {

    private final ApiKeyService service;

    /** GET /api/v1/api-keys — list all keys for this tenant (hashes hidden) */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list() {
        UUID tenantId = TenantContext.getTenantId();
        List<Map<String, Object>> result = service.list(tenantId).stream()
                .map(k -> Map.<String, Object>of(
                    "id",          k.getId(),
                    "name",        k.getName(),
                    "prefix",      k.getKeyPrefix(),
                    "createdAt",   k.getCreatedAt(),
                    "lastUsedAt",  k.getLastUsedAt() != null ? k.getLastUsedAt() : ""
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * POST /api/v1/api-keys
     * Body: { "name": "My integration" }
     * Returns the raw key ONCE — store it securely.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(
            @RequestBody Map<String, String> body) {
        UUID tenantId = TenantContext.getTenantId();
        String name = body.getOrDefault("name", "API Key");
        Map<String, Object> result = service.create(tenantId, name);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** DELETE /api/v1/api-keys/{id} — revoke a key */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> revoke(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        service.revoke(id, tenantId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
