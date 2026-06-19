package com.chatplatform.admin.controller;

import com.chatplatform.admin.dto.PagedResponse;
import com.chatplatform.admin.dto.TenantDto;
import com.chatplatform.admin.dto.UpdateTenantRequest;
import com.chatplatform.admin.service.TenantAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/v1/tenants")
@RequiredArgsConstructor
public class TenantAdminController {

    private final TenantAdminService tenantService;

    /**
     * GET /admin/v1/tenants?search=&status=active&plan=pro&page=0&size=20
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String plan,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var result = tenantService.listTenants(search, status, plan, pageable);

        return ResponseEntity.ok(Map.of(
                "data", PagedResponse.from(result)
        ));
    }

    /**
     * GET /admin/v1/tenants/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(Map.of("data", tenantService.getTenant(id)));
    }

    /**
     * PATCH /admin/v1/tenants/{id} — update status or plan
     */
    @PatchMapping("/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTenantRequest req) {
        return ResponseEntity.ok(Map.of("data", tenantService.updateTenant(id, req)));
    }

    /**
     * POST /admin/v1/tenants/{id}/suspend
     */
    @PostMapping("/{id}/suspend")
    public ResponseEntity<Map<String, Object>> suspend(@PathVariable UUID id) {
        tenantService.suspendTenant(id);
        return ResponseEntity.ok(Map.of("message", "Tenant suspended"));
    }

    /**
     * DELETE /admin/v1/tenants/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable UUID id) {
        tenantService.deleteTenant(id);
        return ResponseEntity.ok(Map.of("message", "Tenant deleted"));
    }
}
