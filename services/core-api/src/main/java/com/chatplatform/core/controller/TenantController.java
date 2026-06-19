package com.chatplatform.core.controller;

import com.chatplatform.core.context.TenantContext;
import com.chatplatform.core.dto.ApiResponse;
import com.chatplatform.core.entity.Tenant;
import com.chatplatform.core.entity.TenantMember;
import com.chatplatform.core.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    /**
     * GET /api/v1/tenants/me
     * Returns the current tenant (workspace) info.
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyTenant() {
        UUID tenantId = TenantContext.getTenantId();
        Tenant tenant = tenantService.getTenantOrThrow(tenantId);

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "id",         tenant.getId(),
                "name",       tenant.getName(),
                "slug",       tenant.getSlug(),
                "plan",       tenant.getPlan(),
                "status",     tenant.getStatus(),
                "apiKey",     tenant.getApiKey(),
                "quota",      tenant.getQuota(),
                "usage",      tenant.getUsage(),
                "createdAt",  tenant.getCreatedAt()
        )));
    }

    /**
     * PUT /api/v1/tenants/me
     * Update workspace name.
     */
    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('owner', 'admin')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateTenant(
            @RequestBody Map<String, String> body) {

        UUID tenantId = TenantContext.getTenantId();
        Tenant updated = tenantService.updateSettings(tenantId, body.get("name"));

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "id",    updated.getId(),
                "name",  updated.getName(),
                "slug",  updated.getSlug()
        )));
    }

    /**
     * GET /api/v1/tenants/me/members
     * List all team members.
     */
    @GetMapping("/me/members")
    public ResponseEntity<ApiResponse<List<TenantMember>>> getMembers() {
        UUID tenantId = TenantContext.getTenantId();
        List<TenantMember> members = tenantService.getMembers(tenantId);
        return ResponseEntity.ok(ApiResponse.ok(members));
    }
}
