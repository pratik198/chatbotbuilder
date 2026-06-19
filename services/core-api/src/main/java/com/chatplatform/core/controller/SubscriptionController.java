package com.chatplatform.core.controller;

import com.chatplatform.core.context.TenantContext;
import com.chatplatform.core.dto.ApiResponse;
import com.chatplatform.core.entity.Subscription;
import com.chatplatform.core.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    static final List<Map<String, Object>> PLANS = List.of(
        Map.of("id", "free",       "name", "Free",       "price", 0,   "messages", 1_000,  "bots", 3,  "members", 5),
        Map.of("id", "starter",    "name", "Starter",    "price", 29,  "messages", 10_000, "bots", 10, "members", 10),
        Map.of("id", "pro",        "name", "Pro",        "price", 99,  "messages", 50_000, "bots", 50, "members", 25),
        Map.of("id", "enterprise", "name", "Enterprise", "price", 299, "messages", -1,     "bots", -1, "members", -1)
    );

    @GetMapping
    public ResponseEntity<ApiResponse<Subscription>> get() {
        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.getOrCreate(TenantContext.getTenantId())));
    }

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> plans() {
        return ResponseEntity.ok(ApiResponse.ok(PLANS));
    }

    @PostMapping("/upgrade")
    public ResponseEntity<ApiResponse<Subscription>> upgrade(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.upgradePlan(TenantContext.getTenantId(), body.get("planId"))));
    }

    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Subscription>> cancel() {
        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.cancel(TenantContext.getTenantId())));
    }
}
