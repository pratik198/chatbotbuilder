package com.chatplatform.analytics.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Pre-aggregated daily stats per tenant + bot.
 * Updated by the analytics consumer on each event.
 * The dashboard reads from this table — no expensive GROUP BY queries at query time.
 */
@Entity
@Table(name = "daily_stats",
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "bot_id", "stat_date"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyStats {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "bot_id", nullable = false)
    private UUID botId;

    @Column(name = "stat_date", nullable = false)
    private LocalDate statDate;

    // Conversation counts
    @Column(name = "conversations_started")
    @Builder.Default
    private int conversationsStarted = 0;

    @Column(name = "conversations_ended")
    @Builder.Default
    private int conversationsEnded = 0;

    // Message counts
    @Column(name = "messages_user")
    @Builder.Default
    private int messagesUser = 0;

    @Column(name = "messages_assistant")
    @Builder.Default
    private int messagesAssistant = 0;

    // LLM usage
    @Column(name = "total_prompt_tokens")
    @Builder.Default
    private long totalPromptTokens = 0;

    @Column(name = "total_completion_tokens")
    @Builder.Default
    private long totalCompletionTokens = 0;

    // Avg latency — stored as running total + count for correct average
    @Column(name = "total_latency_ms")
    @Builder.Default
    private long totalLatencyMs = 0;

    @Column(name = "latency_sample_count")
    @Builder.Default
    private int latencySampleCount = 0;

    // Engagement
    @Column(name = "handoffs_requested")
    @Builder.Default
    private int handoffsRequested = 0;

    @Column(name = "leads_captured")
    @Builder.Default
    private int leadsCaptured = 0;
}
