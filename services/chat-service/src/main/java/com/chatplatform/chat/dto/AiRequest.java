package com.chatplatform.chat.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Sent to ai-service: POST /ai/chat
 */
@Data
@Builder
public class AiRequest {

    private UUID conversationId;
    private UUID botId;
    private UUID tenantId;

    private String modelProvider;
    private String modelName;
    private Double temperature;
    private Integer maxTokens;
    private String systemPrompt;

    private boolean ragEnabled;
    private List<UUID> knowledgeBaseIds;  // which KBs to search
    private Boolean leadCaptureEnabled;

    // Recent conversation history (for context)
    private List<HistoryMessage> history;

    // The new user message to respond to
    private String userMessage;

    @Data
    @Builder
    public static class HistoryMessage {
        private String role;    // "user" | "assistant"
        private String content;
    }
}
