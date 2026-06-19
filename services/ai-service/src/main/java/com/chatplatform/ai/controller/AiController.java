package com.chatplatform.ai.controller;

import com.chatplatform.ai.dto.AiRequest;
import com.chatplatform.ai.dto.AiResponse;
import com.chatplatform.ai.service.AiChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiChatService aiChatService;

    /**
     * POST /ai/chat
     * Called by chat-service. Runs the full RAG + LLM pipeline and returns the response.
     *
     * This is a synchronous blocking call. The caller (chat-service) handles
     * the user-visible timeout (60s) via its own RestTemplate config.
     */
    @PostMapping("/chat")
    public ResponseEntity<AiResponse> chat(@RequestBody AiRequest request) {
        if (request.getUserMessage() == null || request.getUserMessage().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        AiResponse response = aiChatService.chat(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /ai/health
     * Simple health check — also checks if Ollama is reachable.
     * Used by docker-compose healthcheck and monitoring.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "ai-service"));
    }

    /**
     * GET /ai/models
     * Returns a hardcoded list of available models.
     * In production: dynamically fetch from Ollama /api/tags endpoint.
     */
    @GetMapping("/models")
    public ResponseEntity<Map<String, Object>> models() {
        return ResponseEntity.ok(Map.of(
            "models", java.util.List.of(
                Map.of("id", "deepseek-v3",    "name", "DeepSeek V3",     "type", "chat"),
                Map.of("id", "deepseek-r1:8b", "name", "DeepSeek R1 8B",  "type", "chat"),
                Map.of("id", "qwen3:8b",       "name", "Qwen3 8B",        "type", "chat"),
                Map.of("id", "llama3.2:3b",    "name", "Llama 3.2 3B",    "type", "chat"),
                Map.of("id", "mistral",         "name", "Mistral 7B",      "type", "chat")
            )
        ));
    }
}
