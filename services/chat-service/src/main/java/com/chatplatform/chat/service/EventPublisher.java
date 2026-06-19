package com.chatplatform.chat.service;

import com.chatplatform.chat.config.RabbitMQConfig;
import com.chatplatform.chat.entity.Conversation;
import com.chatplatform.chat.entity.Message;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

/**
 * Publishes chat events to RabbitMQ so analytics-service can aggregate them.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishMessageSent(Conversation conv, Message message) {
        Map<String, Object> event = Map.of(
            "eventType",      "message.sent",
            "tenantId",       conv.getTenantId().toString(),
            "botId",          conv.getBotId().toString(),
            "conversationId", conv.getId().toString(),
            "messageId",      message.getId().toString(),
            "role",           message.getRole(),
            "timestamp",      Instant.now().toString()
        );
        publish("message.sent", event);
    }

    public void publishConversationStarted(Conversation conv) {
        Map<String, Object> event = Map.of(
            "eventType",      "conversation.started",
            "tenantId",       conv.getTenantId().toString(),
            "botId",          conv.getBotId().toString(),
            "conversationId", conv.getId().toString(),
            "channel",        conv.getChannel(),
            "timestamp",      Instant.now().toString()
        );
        publish("conversation.started", event);
    }

    public void publishLeadCaptured(java.util.UUID conversationId, java.util.UUID tenantId, java.util.UUID botId) {
        Map<String, Object> event = Map.of(
            "eventType",      "lead.captured",
            "tenantId",       tenantId.toString(),
            "botId",          botId.toString(),
            "conversationId", conversationId.toString(),
            "timestamp",      Instant.now().toString()
        );
        publish("lead.captured", event);
    }

    public void publishHandoffRequested(Conversation conv) {
        Map<String, Object> event = Map.of(
            "eventType",      "handoff.requested",
            "tenantId",       conv.getTenantId().toString(),
            "botId",          conv.getBotId().toString(),
            "conversationId", conv.getId().toString(),
            "timestamp",      Instant.now().toString()
        );
        publish("handoff.requested", event);
    }

    private void publish(String routingKey, Object payload) {
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.ANALYTICS_EXCHANGE, routingKey, payload);
        } catch (Exception e) {
            // Don't fail the chat if analytics publishing fails
            log.warn("Failed to publish event {}: {}", routingKey, e.getMessage());
        }
    }
}
