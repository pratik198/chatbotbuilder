package com.chatplatform.chat.controller;

import com.chatplatform.chat.entity.AgentAvailability;
import com.chatplatform.chat.repository.AgentAvailabilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
public class AgentAvailabilityController {

    private final AgentAvailabilityRepository availabilityRepo;

    /** GET /api/v1/agents/availability?tenantId=... */
    @GetMapping("/availability")
    public ResponseEntity<List<AgentAvailability>> list(
            @RequestParam UUID tenantId,
            @RequestParam(required = false) String status) {

        List<AgentAvailability> result = status != null
                ? availabilityRepo.findByTenantIdAndStatus(tenantId, status)
                : availabilityRepo.findByTenantId(tenantId);
        return ResponseEntity.ok(result);
    }

    /** PUT /api/v1/agents/availability — set my status */
    @PutMapping("/availability")
    public ResponseEntity<AgentAvailability> setStatus(
            @RequestBody Map<String, String> body,
            JwtAuthenticationToken auth) {

        UUID userId   = UUID.fromString(auth.getToken().getSubject());
        UUID tenantId = UUID.fromString(auth.getToken().getClaimAsString("tenant_id"));
        String status = body.getOrDefault("status", "online");

        AgentAvailability av = availabilityRepo.findById(userId)
                .orElse(AgentAvailability.builder()
                        .userId(userId)
                        .tenantId(tenantId)
                        .build());
        av.setStatus(status);
        av.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(availabilityRepo.save(av));
    }
}
