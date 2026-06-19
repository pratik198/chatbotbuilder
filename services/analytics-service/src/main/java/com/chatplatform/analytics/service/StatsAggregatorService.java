package com.chatplatform.analytics.service;

import com.chatplatform.analytics.dto.AnalyticsEvent;
import com.chatplatform.analytics.entity.DailyStats;
import com.chatplatform.analytics.repository.DailyStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * Updates the pre-aggregated DailyStats table based on incoming events.
 * Uses upsert semantics: find-or-create then increment the right counters.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatsAggregatorService {

    private final DailyStatsRepository statsRepo;

    @Transactional
    public void ingest(AnalyticsEvent event) {
        if (event.getTenantId() == null || event.getBotId() == null) {
            log.warn("Skipping event with null tenantId or botId: {}", event.getEventType());
            return;
        }

        LocalDate date = event.getOccurredAt() != null
                ? event.getOccurredAt().atZone(ZoneOffset.UTC).toLocalDate()
                : LocalDate.now(ZoneOffset.UTC);

        DailyStats stats = findOrCreate(event.getTenantId(), event.getBotId(), date);

        switch (event.getEventType()) {
            case "conversation.started" -> stats.setConversationsStarted(stats.getConversationsStarted() + 1);
            case "conversation.ended"   -> stats.setConversationsEnded(stats.getConversationsEnded() + 1);

            case "message.sent" -> {
                if ("user".equals(event.getMessageRole())) {
                    stats.setMessagesUser(stats.getMessagesUser() + 1);
                } else if ("assistant".equals(event.getMessageRole())) {
                    stats.setMessagesAssistant(stats.getMessagesAssistant() + 1);
                    if (event.getPromptTokens() != null) {
                        stats.setTotalPromptTokens(stats.getTotalPromptTokens() + event.getPromptTokens());
                    }
                    if (event.getCompletionTokens() != null) {
                        stats.setTotalCompletionTokens(stats.getTotalCompletionTokens() + event.getCompletionTokens());
                    }
                    if (event.getLatencyMs() != null) {
                        stats.setTotalLatencyMs(stats.getTotalLatencyMs() + event.getLatencyMs());
                        stats.setLatencySampleCount(stats.getLatencySampleCount() + 1);
                    }
                }
            }

            case "handoff.requested" -> stats.setHandoffsRequested(stats.getHandoffsRequested() + 1);
            case "lead.captured"     -> stats.setLeadsCaptured(stats.getLeadsCaptured() + 1);

            default -> log.debug("Unknown analytics event type: {}", event.getEventType());
        }

        statsRepo.save(stats);
    }

    private DailyStats findOrCreate(UUID tenantId, UUID botId, LocalDate date) {
        return statsRepo.findByTenantIdAndBotIdAndStatDate(tenantId, botId, date)
                .orElseGet(() -> statsRepo.save(
                    DailyStats.builder()
                        .tenantId(tenantId)
                        .botId(botId)
                        .statDate(date)
                        .build()
                ));
    }
}
