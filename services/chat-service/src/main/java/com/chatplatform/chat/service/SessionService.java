package com.chatplatform.chat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Stores lightweight visitor session data in Redis.
 * Keeps conversation state between WebSocket reconnects.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    @Value("${app.session-ttl-minutes:30}")
    private int sessionTtlMinutes;

    private static final String SESSION_PREFIX = "visitor:session:";

    // ── Store/retrieve conversation ID for a session ─────────────

    public void saveConversationId(String sessionKey, UUID conversationId) {
        String key = SESSION_PREFIX + sessionKey;
        redis.opsForHash().put(key, "conversationId", conversationId.toString());
        redis.expire(key, sessionTtlMinutes, TimeUnit.MINUTES);
    }

    public UUID getConversationId(String sessionKey) {
        String value = (String) redis.opsForHash().get(SESSION_PREFIX + sessionKey, "conversationId");
        return value != null ? UUID.fromString(value) : null;
    }

    // ── Online agents per tenant ──────────────────────────────────

    public void markAgentOnline(UUID tenantId, UUID userId) {
        redis.opsForSet().add("agents:online:" + tenantId, userId.toString());
        // TTL refreshed on each heartbeat
        redis.expire("agents:online:" + tenantId, 2, TimeUnit.MINUTES);
    }

    public void markAgentOffline(UUID tenantId, UUID userId) {
        redis.opsForSet().remove("agents:online:" + tenantId, userId.toString());
    }

    public boolean hasOnlineAgents(UUID tenantId) {
        Long size = redis.opsForSet().size("agents:online:" + tenantId);
        return size != null && size > 0;
    }

    // ── Bot config cache (avoid DB hit on every WS connect) ──────

    public void cacheBotConfig(UUID botId, Map<String, Object> config) {
        try {
            String json = objectMapper.writeValueAsString(config);
            redis.opsForValue().set("bot:config:" + botId, json, 5, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Failed to cache bot config", e);
        }
    }

    public Map<String, Object> getCachedBotConfig(UUID botId) {
        String json = redis.opsForValue().get("bot:config:" + botId);
        if (json == null) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return null;
        }
    }

    // ── Refresh session TTL (keep alive while chat is active) ────

    public void refreshSession(String sessionKey) {
        redis.expire(SESSION_PREFIX + sessionKey, sessionTtlMinutes, TimeUnit.MINUTES);
    }
}
