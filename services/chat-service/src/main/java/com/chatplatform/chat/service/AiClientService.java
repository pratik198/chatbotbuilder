package com.chatplatform.chat.service;

import com.chatplatform.chat.dto.AiRequest;
import com.chatplatform.chat.dto.AiResponse;
import com.chatplatform.chat.entity.Bot;
import com.chatplatform.chat.entity.Message;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.UUID;

/**
 * Calls ai-service to get the AI response for a user message.
 * Simple synchronous HTTP call — easy to understand, works out of the box.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiClientService {

    private final RestTemplate restTemplate;

    @Value("${app.ai-service-url}")
    private String aiServiceUrl;

    /**
     * Sends the conversation context + user message to ai-service.
     * Returns the complete assistant response.
     */
    public AiResponse chat(Bot bot, UUID conversationId, List<Message> history, String userMessage) {

        // Build history for AI context (last N messages)
        List<AiRequest.HistoryMessage> historyMessages = history.stream()
                .filter(m -> "user".equals(m.getRole()) || "assistant".equals(m.getRole()))
                .map(m -> AiRequest.HistoryMessage.builder()
                        .role(m.getRole())
                        .content(m.getContent())
                        .build())
                .toList();

        AiRequest request = AiRequest.builder()
                .conversationId(conversationId)
                .botId(bot.getId())
                .tenantId(bot.getTenantId())
                .modelProvider(bot.getModelProvider())
                .modelName(bot.getModelName())
                .temperature(bot.getTemperature())
                .maxTokens(bot.getMaxTokens())
                .systemPrompt(bot.getSystemPrompt())
                .ragEnabled(bot.isRagEnabled())
                .leadCaptureEnabled(bot.isLeadCaptureEnabled())
                .history(historyMessages)
                .userMessage(userMessage)
                .build();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<AiResponse> response = restTemplate.postForEntity(
                    aiServiceUrl + "/ai/chat",
                    new HttpEntity<>(request, headers),
                    AiResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }

            log.error("ai-service returned {}", response.getStatusCode());
            return fallbackResponse();

        } catch (Exception e) {
            log.error("Failed to call ai-service: {}", e.getMessage());
            return fallbackResponse();
        }
    }

    // Returns a graceful message when AI is unavailable
    private AiResponse fallbackResponse() {
        AiResponse r = new AiResponse();
        r.setContent("I'm having trouble connecting right now. Please try again in a moment.");
        r.setModelUsed("fallback");
        return r;
    }
}
