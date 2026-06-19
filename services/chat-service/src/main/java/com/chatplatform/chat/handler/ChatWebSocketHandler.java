package com.chatplatform.chat.handler;

import com.chatplatform.chat.dto.AiResponse;
import com.chatplatform.chat.dto.WsMessage;
import com.chatplatform.chat.entity.Bot;
import com.chatplatform.chat.entity.Conversation;
import com.chatplatform.chat.entity.Message;
import com.chatplatform.chat.repository.BotRepository;
import com.chatplatform.chat.service.AiClientService;
import com.chatplatform.chat.service.ConversationService;
import com.chatplatform.chat.service.EventPublisher;
import com.chatplatform.chat.service.LeadCaptureService;
import com.chatplatform.chat.service.SessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Handles the visitor-facing WebSocket: /ws/chat/{embedToken}
 *
 * Connection lifecycle:
 *  1. afterConnectionEstablished — resolve bot, create/restore conversation, send welcome
 *  2. handleTextMessage          — process incoming message (chat, handoff, feedback)
 *  3. afterConnectionClosed      — clean up, end conversation if needed
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final BotRepository botRepo;
    private final ConversationService conversationService;
    private final SessionService sessionService;
    private final AiClientService aiClient;
    private final EventPublisher eventPublisher;
    private final LeadCaptureService leadCaptureService;
    private final ObjectMapper objectMapper;

    // Track active WebSocket sessions: wsSessionId → conversationId
    private final Map<String, UUID> sessionConversationMap = new ConcurrentHashMap<>();
    // Track wsSessionId → bot (to avoid DB lookup on every message)
    private final Map<String, Bot> sessionBotMap = new ConcurrentHashMap<>();
    // Track which sessions have already had a lead captured
    private final Map<String, Boolean> leadCapturedSessions = new ConcurrentHashMap<>();

    // ── Connection opened ────────────────────────────────────────

    @Override
    public void afterConnectionEstablished(WebSocketSession wsSession) throws Exception {
        String embedToken = extractEmbedToken(wsSession);
        String sessionKey = getSessionKey(wsSession);

        Bot bot = botRepo.findByEmbedToken(embedToken)
                .filter(b -> "active".equals(b.getStatus()))
                .orElse(null);

        if (bot == null) {
            send(wsSession, WsMessage.error("Bot not found or inactive"));
            wsSession.close(CloseStatus.BAD_DATA);
            return;
        }

        // Get or create a conversation for this visitor session
        String visitorIp = Objects.toString(wsSession.getRemoteAddress(), "unknown");
        String userAgent = getHeaderValue(wsSession, "User-Agent");
        Conversation conversation = conversationService.getOrCreate(bot, sessionKey, visitorIp, userAgent);

        // Remember the mapping for this WebSocket connection
        sessionConversationMap.put(wsSession.getId(), conversation.getId());
        sessionBotMap.put(wsSession.getId(), bot);
        sessionService.saveConversationId(sessionKey, conversation.getId());

        // Send welcome
        String welcome = (String) bot.getWidgetConfig().getOrDefault("welcome_message", "Hi! How can I help?");
        send(wsSession, WsMessage.text("assistant", welcome));

        eventPublisher.publishConversationStarted(conversation);
        log.debug("WS connected: session={} conv={} bot={}", wsSession.getId(), conversation.getId(), bot.getId());
    }

    // ── Message received ─────────────────────────────────────────

    @Override
    protected void handleTextMessage(WebSocketSession wsSession, TextMessage raw) throws Exception {
        WsMessage incoming;
        try {
            incoming = objectMapper.readValue(raw.getPayload(), WsMessage.class);
        } catch (Exception e) {
            send(wsSession, WsMessage.error("Invalid message format"));
            return;
        }

        switch (incoming.getType() != null ? incoming.getType() : "") {
            case "message"         -> handleChatMessage(wsSession, incoming);
            case "handoff_request" -> handleHandoffRequest(wsSession);
            case "feedback"        -> handleFeedback(wsSession, incoming);
            case "typing"          -> { /* nothing to do server-side */ }
            default                -> send(wsSession, WsMessage.error("Unknown message type: " + incoming.getType()));
        }
    }

    // ── Connection closed ────────────────────────────────────────

    @Override
    public void afterConnectionClosed(WebSocketSession wsSession, CloseStatus status) {
        UUID conversationId = sessionConversationMap.remove(wsSession.getId());
        sessionBotMap.remove(wsSession.getId());
        leadCapturedSessions.remove(wsSession.getId());

        if (conversationId != null) {
            conversationService.endConversation(conversationId);
        }
        log.debug("WS disconnected: session={} status={}", wsSession.getId(), status);
    }

    // ── Private message handlers ─────────────────────────────────

    private void handleChatMessage(WebSocketSession wsSession, WsMessage incoming) throws IOException {
        String userText = incoming.getContent();
        if (userText == null || userText.isBlank()) return;

        UUID conversationId = sessionConversationMap.get(wsSession.getId());
        Bot bot = sessionBotMap.get(wsSession.getId());
        if (conversationId == null || bot == null) {
            send(wsSession, WsMessage.error("Session not found, please refresh"));
            return;
        }

        // 1. Save user message
        Message userMsg = conversationService.saveMessage(
                conversationId, bot.getTenantId(), "user", userText,
                null, null, null, null);

        // 2. Load recent history for context
        List<Message> history = conversationService.getRecentMessages(conversationId);

        // 3. Signal "thinking"
        send(wsSession, WsMessage.of("thinking", null));

        // 4. Call AI service
        long start = System.currentTimeMillis();
        AiResponse aiResponse = aiClient.chat(bot, conversationId, history, userText);
        int latency = (int) (System.currentTimeMillis() - start);

        // 5. Save assistant response
        Message assistantMsg = conversationService.saveMessage(
                conversationId, bot.getTenantId(), "assistant", aiResponse.getContent(),
                aiResponse.getModelUsed(), aiResponse.getPromptTokens(),
                aiResponse.getCompletionTokens(), latency);

        // 6. Send response to visitor
        send(wsSession, WsMessage.text("assistant", aiResponse.getContent()));

        // 6b. Capture lead if enabled and not yet captured
        if (bot.isLeadCaptureEnabled() && !leadCapturedSessions.getOrDefault(wsSession.getId(), false)) {
            boolean captured = leadCaptureService.tryCapture(bot.getTenantId(), userText, null);
            if (captured) {
                leadCapturedSessions.put(wsSession.getId(), true);
                eventPublisher.publishLeadCaptured(conversationId, bot.getTenantId(), bot.getId());
            }
        }

        // 7. Publish analytics event
        Conversation conv = new Conversation();
        conv.setId(conversationId);
        conv.setTenantId(bot.getTenantId());
        conv.setBotId(bot.getId());
        conv.setChannel("web");
        eventPublisher.publishMessageSent(conv, assistantMsg);
    }

    private void handleHandoffRequest(WebSocketSession wsSession) throws IOException {
        UUID conversationId = sessionConversationMap.get(wsSession.getId());
        Bot bot = sessionBotMap.get(wsSession.getId());
        if (conversationId == null || bot == null) return;

        conversationService.markHandedOff(conversationId);

        // Tell the visitor they're in queue
        send(wsSession, WsMessage.of("handoff_queued",
                Map.of("message", "Connecting you to an agent, please wait...")));

        // Notify agents via the AgentWebSocketHandler (via EventPublisher)
        Conversation conv = new Conversation();
        conv.setId(conversationId);
        conv.setTenantId(bot.getTenantId());
        conv.setBotId(bot.getId());
        conv.setChannel("web");
        eventPublisher.publishHandoffRequested(conv);

        log.info("Handoff requested for conversation {}", conversationId);
    }

    private void handleFeedback(WebSocketSession wsSession, WsMessage incoming) {
        // Store rating in analytics — simple for now
        log.info("Feedback received: rating={} conv={}",
                incoming.getRating(), sessionConversationMap.get(wsSession.getId()));
    }

    // ── Utilities ────────────────────────────────────────────────

    private void send(WebSocketSession session, WsMessage message) throws IOException {
        if (session.isOpen()) {
            String json = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(json));
        }
    }

    private String extractEmbedToken(WebSocketSession session) {
        // URL pattern: /ws/chat/{embedToken}
        String path = Objects.requireNonNull(session.getUri()).getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private String getSessionKey(WebSocketSession session) {
        // Visitor sends their session key as a query param: ?sessionKey=uuid
        // If missing, generate one (new visitor)
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        if (query != null && query.contains("sessionKey=")) {
            for (String param : query.split("&")) {
                if (param.startsWith("sessionKey=")) {
                    return param.substring("sessionKey=".length());
                }
            }
        }
        return UUID.randomUUID().toString();
    }

    private String getHeaderValue(WebSocketSession session, String headerName) {
        List<String> values = session.getHandshakeHeaders().get(headerName);
        return (values != null && !values.isEmpty()) ? values.get(0) : null;
    }
}
