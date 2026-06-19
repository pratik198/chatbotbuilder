package com.chatplatform.chat.handler;

import com.chatplatform.chat.dto.WsMessage;
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
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Authenticated WebSocket for agents: /ws/inbox
 * Agents connect here to receive handoff notifications and chat with visitors.
 *
 * Agents send their JWT as a query param:
 *   ws://api.yourdomain.com/ws/inbox?token=eyJ...
 * (In production, use a proper WS auth interceptor)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AgentWebSocketHandler extends TextWebSocketHandler {

    private final SessionService sessionService;
    private final ObjectMapper objectMapper;

    // tenantId → set of open agent WebSocket sessions
    private static final Map<String, Map<String, WebSocketSession>> tenantAgentSessions
            = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String tenantId = getTenantId(session);
        String userId = getUserId(session);

        if (tenantId == null || userId == null) {
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        // Register this agent session
        tenantAgentSessions.computeIfAbsent(tenantId, k -> new ConcurrentHashMap<>())
                .put(session.getId(), session);

        sessionService.markAgentOnline(UUID.fromString(tenantId), UUID.fromString(userId));

        send(session, WsMessage.of("connected", Map.of("message", "Connected to agent inbox")));
        log.info("Agent {} connected to inbox for tenant {}", userId, tenantId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String tenantId = getTenantId(session);
        String userId = getUserId(session);

        if (tenantId != null) {
            Map<String, WebSocketSession> agentSessions = tenantAgentSessions.get(tenantId);
            if (agentSessions != null) {
                agentSessions.remove(session.getId());
            }
        }

        if (tenantId != null && userId != null) {
            sessionService.markAgentOffline(UUID.fromString(tenantId), UUID.fromString(userId));
        }
        log.info("Agent {} disconnected from inbox", userId);
    }

    /**
     * Broadcast a message to all agents of a tenant.
     * Called from EventPublisher when a handoff or visitor message arrives.
     */
    public void broadcastToTenant(String tenantId, WsMessage message) {
        Map<String, WebSocketSession> agentSessions = tenantAgentSessions.get(tenantId);
        if (agentSessions == null || agentSessions.isEmpty()) return;

        agentSessions.values().forEach(session -> {
            try {
                send(session, message);
            } catch (IOException e) {
                log.warn("Failed to send to agent session {}", session.getId());
            }
        });
    }

    private void send(WebSocketSession session, WsMessage message) throws IOException {
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
        }
    }

    // Extract tenantId from query param: ?tenantId=xxx&userId=yyy
    private String getTenantId(WebSocketSession session) {
        return getQueryParam(session, "tenantId");
    }

    private String getUserId(WebSocketSession session) {
        return getQueryParam(session, "userId");
    }

    private String getQueryParam(WebSocketSession session, String name) {
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        if (query == null) return null;
        for (String param : query.split("&")) {
            if (param.startsWith(name + "=")) {
                return param.substring(name.length() + 1);
            }
        }
        return null;
    }
}
