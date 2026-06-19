package com.chatplatform.ai.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Returned to chat-service after the LLM call.
 */
@Data
@Builder
public class AiResponse {

    private String content;             // the assistant's reply
    private String modelUsed;
    private Integer promptTokens;
    private Integer completionTokens;
    private Integer latencyMs;
    private List<RelevantChunk> sources; // RAG chunks used (if any)
}
