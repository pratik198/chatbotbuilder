package com.chatplatform.chat.dto;

import lombok.Data;

import java.util.List;

/**
 * Response from ai-service: POST /ai/chat
 */
@Data
public class AiResponse {

    private String content;         // full assistant reply
    private String modelUsed;
    private Integer promptTokens;
    private Integer completionTokens;
    private Integer latencyMs;
    private List<Object> sources;   // RAG source chunks used
}
