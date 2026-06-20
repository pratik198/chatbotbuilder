package com.chatplatform.chat.controller;

import com.chatplatform.chat.dto.AiResponse;
import com.chatplatform.chat.dto.WsMessage;
import com.chatplatform.chat.entity.Bot;
import com.chatplatform.chat.entity.Conversation;
import com.chatplatform.chat.entity.Message;
import com.chatplatform.chat.repository.BotRepository;
import com.chatplatform.chat.service.AiClientService;
import com.chatplatform.chat.service.ConversationService;
import com.chatplatform.chat.service.EventPublisher;
import com.chatplatform.chat.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Public REST endpoints used by the chat widget.
 * No authentication required — secured by embed token only.
 *
 * Used as fallback when WebSocket is not available (e.g. some firewalls block WS).
 */
@RestController
@RequestMapping("/public/v1")
@RequiredArgsConstructor
public class PublicChatController {

    private final BotRepository botRepo;
    private final ConversationService conversationService;
    private final AiClientService aiClient;
    private final SessionService sessionService;
    private final EventPublisher eventPublisher;

    private final ExecutorService sseExecutor = Executors.newCachedThreadPool();

    /**
     * GET /public/v1/bots/{embedToken}/config
     * Widget fetches bot appearance and settings on load.
     */
    @GetMapping("/bots/{embedToken}/config")
    public ResponseEntity<Map<String, Object>> getBotConfig(@PathVariable String embedToken) {
        Bot bot = botRepo.findByEmbedToken(embedToken)
                .filter(b -> "active".equals(b.getStatus()))
                .orElse(null);

        if (bot == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of(
            "botId",         bot.getId(),
            "name",          bot.getName() != null ? bot.getName() : "",
            "language",      bot.getLanguage() != null ? bot.getLanguage() : "en",
            "widgetConfig",  bot.getWidgetConfig(),
            "liveChatEnabled", bot.isLiveChatEnabled()
        ));
    }

    /**
     * POST /public/v1/chat
     * REST-based chat (SSE streaming response).
     *
     * Request body:
     * {
     *   "embedToken": "abc123",
     *   "sessionKey": "visitor-uuid",
     *   "message": "Hello"
     * }
     *
     * Returns a Server-Sent Events stream with:
     *   data: {"type":"token","delta":"Hi"}\n\n
     *   data: {"type":"done","content":"Hi there!"}\n\n
     */
    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@RequestBody Map<String, String> body,
                           HttpServletRequest request) {

        String embedToken = body.get("embedToken");
        String sessionKey = body.getOrDefault("sessionKey", UUID.randomUUID().toString());
        String userMessage = body.get("message");

        SseEmitter emitter = new SseEmitter(60_000L); // 60s timeout

        sseExecutor.execute(() -> {
            try {
                Bot bot = botRepo.findByEmbedToken(embedToken)
                        .filter(b -> "active".equals(b.getStatus()))
                        .orElse(null);

                if (bot == null || userMessage == null || userMessage.isBlank()) {
                    emitter.send(SseEmitter.event().data("{\"type\":\"error\",\"message\":\"Invalid request\"}"));
                    emitter.complete();
                    return;
                }

                // Get or create conversation
                String ip = request.getRemoteAddr();
                String ua = request.getHeader("User-Agent");
                boolean isNew = !conversationService.exists(bot, sessionKey);
                Conversation conv = conversationService.getOrCreate(bot, sessionKey, ip, ua);

                if (isNew) {
                    eventPublisher.publishConversationStarted(conv);
                }

                // Save user message
                Message userMsg = conversationService.saveMessage(conv.getId(), bot.getTenantId(),
                        "user", userMessage, null, null, null, null);

                // Publish user message analytics
                eventPublisher.publishMessageSent(conv, userMsg);

                // Get recent history
                List<Message> history = conversationService.getRecentMessages(conv.getId());

                // Call AI
                long start = System.currentTimeMillis();
                AiResponse aiResponse = aiClient.chat(bot, conv.getId(), history, userMessage);
                int latency = (int) (System.currentTimeMillis() - start);

                // Save assistant message
                Message assistantMsg = conversationService.saveMessage(conv.getId(), bot.getTenantId(),
                        "assistant", aiResponse.getContent(),
                        aiResponse.getModelUsed(), aiResponse.getPromptTokens(),
                        aiResponse.getCompletionTokens(), latency);

                // Stream tokens (simulate streaming by sending the full response as one chunk)
                emitter.send(SseEmitter.event()
                        .data("{\"type\":\"token\",\"delta\":" + jsonString(aiResponse.getContent()) + "}"));

                emitter.send(SseEmitter.event()
                        .data("{\"type\":\"done\",\"content\":" + jsonString(aiResponse.getContent()) + "}"));

                emitter.complete();

                // Publish assistant message analytics
                eventPublisher.publishMessageSent(conv, assistantMsg);

            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event()
                        .data("{\"type\":\"error\",\"message\":\"Server error: " + e.getMessage().replace("\"","'") + "\"}"));
                } catch (IOException ignored) {}
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    /**
     * POST /public/v1/chat/feedback
     * Visitor rates the conversation.
     */
    @PostMapping("/chat/feedback")
    public ResponseEntity<Map<String, String>> submitFeedback(
            @RequestBody Map<String, Object> body) {
        // Store feedback (simple implementation — just log for now)
        // In production: save to a feedbacks table and update analytics
        return ResponseEntity.ok(Map.of("status", "received"));
    }

    // Safely encode a string as a JSON value
    private String jsonString(String value) {
        if (value == null) return "null";
        return "\"" + value.replace("\\", "\\\\")
                           .replace("\"", "\\\"")
                           .replace("\n", "\\n")
                           .replace("\r", "\\r") + "\"";
    }
}
