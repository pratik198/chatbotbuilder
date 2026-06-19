package com.chatplatform.admin.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "daily_stats")
public class DailyStats {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "bot_id", nullable = false)
    private UUID botId;

    @Column(name = "stat_date", nullable = false)
    private LocalDate statDate;

    @Column(name = "conversations_started")
    private int conversationsStarted;

    @Column(name = "conversations_ended")
    private int conversationsEnded;

    @Column(name = "messages_user")
    private int messagesUser;

    @Column(name = "messages_assistant")
    private int messagesAssistant;

    @Column(name = "total_prompt_tokens")
    private long totalPromptTokens;

    @Column(name = "total_completion_tokens")
    private long totalCompletionTokens;

    @Column(name = "total_latency_ms")
    private long totalLatencyMs;

    @Column(name = "latency_sample_count")
    private int latencySampleCount;

    @Column(name = "handoffs_requested")
    private int handoffsRequested;

    @Column(name = "leads_captured")
    private int leadsCaptured;
}
