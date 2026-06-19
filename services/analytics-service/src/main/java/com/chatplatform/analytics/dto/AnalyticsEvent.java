package com.chatplatform.analytics.dto;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/**
 * Generic event published by chat-service to the analytics.events exchange.
 *
 * eventType values:
 *   "conversation.started"   — new chat session
 *   "message.sent"           — a message was exchanged (user or assistant)
 *   "conversation.ended"     — session ended
 *   "handoff.requested"      — visitor requested a human agent
 *   "lead.captured"          — contact info collected
 *
 * Not all fields are used for every event type.
 */
@Data
public class AnalyticsEvent {

    private String eventType;
    private UUID tenantId;
    private UUID botId;
    private UUID conversationId;
    private String channel;             // "web" | "api"

    // Message-specific
    private String messageRole;         // "user" | "assistant"
    private Integer promptTokens;
    private Integer completionTokens;
    private Integer latencyMs;
    private String modelUsed;

    // Conversation-specific
    private Integer messageCount;
    private String endReason;           // "user_closed" | "timeout" | "handoff"

    private Instant occurredAt;
}
