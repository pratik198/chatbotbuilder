package com.chatplatform.core.controller;

import com.chatplatform.core.context.TenantContext;
import com.chatplatform.core.dto.ApiResponse;
import com.chatplatform.core.dto.PagedResponse;
import com.chatplatform.core.entity.WebhookDelivery;
import com.chatplatform.core.repository.WebhookDeliveryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookDeliveryRepository deliveryRepo;

    @GetMapping("/deliveries")
    public ResponseEntity<ApiResponse<PagedResponse<WebhookDelivery>>> list(
            @RequestParam(required = false) UUID actionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID tenantId = TenantContext.getTenantId();
        var result = actionId != null
                ? deliveryRepo.findByActionIdOrderByCreatedAtDesc(actionId, PageRequest.of(page, size))
                : deliveryRepo.findByTenantIdOrderByCreatedAtDesc(tenantId, PageRequest.of(page, size));

        return ResponseEntity.ok(ApiResponse.ok(PagedResponse.from(result)));
    }
}
