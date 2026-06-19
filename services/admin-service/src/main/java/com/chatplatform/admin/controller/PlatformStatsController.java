package com.chatplatform.admin.controller;

import com.chatplatform.admin.service.PlatformStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/admin/v1/stats")
@RequiredArgsConstructor
public class PlatformStatsController {

    private final PlatformStatsService statsService;

    /**
     * GET /admin/v1/stats
     * Platform-wide summary: tenant counts, user counts, 30-day usage.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(Map.of("data", statsService.getPlatformStats()));
    }
}
