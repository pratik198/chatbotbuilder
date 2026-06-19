package com.chatplatform.core.controller;

import com.chatplatform.core.context.TenantContext;
import com.chatplatform.core.dto.ApiResponse;
import com.chatplatform.core.entity.Integration;
import com.chatplatform.core.service.IntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/integrations")
@RequiredArgsConstructor
public class IntegrationController {

    private final IntegrationService integrationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Integration>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(
                integrationService.listByTenant(TenantContext.getTenantId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Integration>> create(@RequestBody CreateRequest req) {
        Integration i = integrationService.create(
                TenantContext.getTenantId(), req.type(), req.name(), req.config(), req.credentials());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(i));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integration>> update(
            @PathVariable UUID id, @RequestBody UpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(
                integrationService.update(id, req.name(), req.status(), req.config(), req.credentials())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        integrationService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    record CreateRequest(String type, String name, Map<String, Object> config, Map<String, Object> credentials) {}
    record UpdateRequest(String name, String status, Map<String, Object> config, Map<String, Object> credentials) {}
}
