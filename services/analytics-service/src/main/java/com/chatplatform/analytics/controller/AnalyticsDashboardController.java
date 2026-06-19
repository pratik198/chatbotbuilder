package com.chatplatform.analytics.controller;

import com.chatplatform.analytics.entity.DailyStats;
import com.chatplatform.analytics.repository.DailyStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

/**
 * Dashboard API — queried by the frontend for charts and summary cards.
 * tenantId is extracted from the JWT (set by Keycloak as a custom claim).
 */
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsDashboardController {

    private final DailyStatsRepository statsRepo;

    /**
     * GET /api/v1/analytics/summary?botId=uuid&days=30
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary(
            @RequestParam(required = false) UUID botId,
            @RequestParam(defaultValue = "30") int days,
            JwtAuthenticationToken jwt) {

        UUID tenantId = extractTenantId(jwt);
        LocalDate to   = LocalDate.now();
        LocalDate from = to.minusDays(days - 1);

        List<DailyStats> rows = (botId != null)
                ? statsRepo.findByTenantAndBotInRange(tenantId, botId, from, to)
                : statsRepo.findByTenantInRange(tenantId, from, to);

        long totalConversations = rows.stream().mapToLong(DailyStats::getConversationsStarted).sum();
        long totalMessages      = rows.stream().mapToLong(s -> s.getMessagesUser() + s.getMessagesAssistant()).sum();
        long totalPromptTokens  = rows.stream().mapToLong(DailyStats::getTotalPromptTokens).sum();
        long totalCompletion    = rows.stream().mapToLong(DailyStats::getTotalCompletionTokens).sum();
        long totalHandoffs      = rows.stream().mapToLong(DailyStats::getHandoffsRequested).sum();
        long totalLeads         = rows.stream().mapToLong(DailyStats::getLeadsCaptured).sum();

        long sampleCount  = rows.stream().mapToLong(DailyStats::getLatencySampleCount).sum();
        long totalLatency = rows.stream().mapToLong(DailyStats::getTotalLatencyMs).sum();
        double avgLatencyMs = sampleCount > 0 ? (double) totalLatency / sampleCount : 0;

        return ResponseEntity.ok(Map.of(
            "totalConversations",    totalConversations,
            "totalMessages",         totalMessages,
            "totalPromptTokens",     totalPromptTokens,
            "totalCompletionTokens", totalCompletion,
            "totalHandoffs",         totalHandoffs,
            "totalLeads",            totalLeads,
            "avgResponseTimeMs",     Math.round(avgLatencyMs),
            "periodDays",            days
        ));
    }

    /**
     * GET /api/v1/analytics/timeseries?from=2024-01-01&to=2024-01-31&botId=uuid
     */
    @GetMapping("/timeseries")
    public ResponseEntity<List<Map<String, Object>>> timeseries(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) UUID botId,
            JwtAuthenticationToken jwt) {

        UUID tenantId = extractTenantId(jwt);

        List<DailyStats> rows = (botId != null)
                ? statsRepo.findByTenantAndBotInRange(tenantId, botId, from, to)
                : statsRepo.findByTenantInRange(tenantId, from, to);

        List<Map<String, Object>> series = rows.stream()
                .map(s -> {
                    Map<String, Object> point = new LinkedHashMap<>();
                    point.put("date",         s.getStatDate().toString());
                    point.put("conversations", s.getConversationsStarted());
                    point.put("messagesUser",  s.getMessagesUser());
                    point.put("messagesBot",   s.getMessagesAssistant());
                    point.put("handoffs",      s.getHandoffsRequested());
                    point.put("leads",         s.getLeadsCaptured());
                    long samples = s.getLatencySampleCount();
                    point.put("avgLatencyMs",  samples > 0 ? s.getTotalLatencyMs() / samples : 0);
                    return point;
                })
                .toList();

        return ResponseEntity.ok(series);
    }

    // ── Private ──────────────────────────────────────────────────

    private UUID extractTenantId(JwtAuthenticationToken jwt) {
        String tid = jwt.getToken().getClaimAsString("tenant_id");
        if (tid == null) {
            throw new IllegalStateException("tenant_id claim missing from JWT");
        }
        return UUID.fromString(tid);
    }
}
