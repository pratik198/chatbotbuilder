package com.chatplatform.ai.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Received from chat-service: POST /ai/chat
 * Contains everything the AI needs to generate a response.
 */
@Data
public class AiRequest {

    private UUID conversationId;
    private UUID botId;
    private UUID tenantId;

    // Which LLM to use
    private String modelProvider;   // "ollama" | "vllm"
    private String modelName;       // "deepseek-v3" | "qwen3:32b" | etc.
    private Double temperature;
    private Integer maxTokens;

    // Bot personality
    private String systemPrompt;

    // RAG
    private boolean ragEnabled;
    private List<UUID> knowledgeBaseIds;

    // Lead capture
    private Boolean leadCaptureEnabled;

    // Conversation context (last N messages)
    private List<HistoryMessage> history;

    // The new message to respond to
    private String userMessage;

    @Data
    public static class HistoryMessage {
        private String role;     // "user" | "assistant"
        private String content;
    }
}
