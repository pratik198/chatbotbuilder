package com.chatplatform.core.controller;

import com.chatplatform.core.context.TenantContext;
import com.chatplatform.core.dto.ApiResponse;
import com.chatplatform.core.dto.PagedResponse;
import com.chatplatform.core.entity.Handoff;
import com.chatplatform.core.service.HandoffService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/handoffs")
@RequiredArgsConstructor
public class HandoffController {

    private final HandoffService handoffService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<Handoff>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID tenantId = TenantContext.getTenantId();
        Page<Handoff> result = handoffService.list(tenantId, status, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.from(result)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Handoff>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(handoffService.getById(id)));
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<Handoff>> assign(
            @PathVariable UUID id,
            @RequestBody AssignRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(handoffService.assign(id, req.agentId())));
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<Handoff>> resolve(
            @PathVariable UUID id,
            @RequestBody(required = false) ResolveRequest req) {
        String notes = req != null ? req.notes() : null;
        return ResponseEntity.ok(ApiResponse.ok(handoffService.resolve(id, notes)));
    }

    record AssignRequest(UUID agentId) {}
    record ResolveRequest(String notes) {}
}
