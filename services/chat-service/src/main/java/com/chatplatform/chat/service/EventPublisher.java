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
        Map<String, Object> event = new java.util.HashMap<>();
        event.put("eventType",      "message.sent");
        event.put("tenantId",       conv.getTenantId().toString());
        event.put("botId",          conv.getBotId().toString());
        event.put("conversationId", conv.getId().toString());
        event.put("messageId",      message.getId().toString());
        event.put("messageRole",    message.getRole());
        event.put("occurredAt",     Instant.now().toString());
        publish("message.sent", event);
    }

    public void publishConversationStarted(Conversation conv) {
        Map<String, Object> event = new java.util.HashMap<>();
        event.put("eventType",      "conversation.started");
        event.put("tenantId",       conv.getTenantId().toString());
        event.put("botId",          conv.getBotId().toString());
        event.put("conversationId", conv.getId().toString());
        event.put("channel",        conv.getChannel());
        event.put("occurredAt",     Instant.now().toString());
        publish("conversation.started", event);
    }

    public void publishLeadCaptured(java.util.UUID conversationId, java.util.UUID tenantId, java.util.UUID botId) {
        Map<String, Object> event = new java.util.HashMap<>();
        event.put("eventType",      "lead.captured");
        event.put("tenantId",       tenantId.toString());
        event.put("botId",          botId.toString());
        event.put("conversationId", conversationId.toString());
        event.put("occurredAt",     Instant.now().toString());
        publish("lead.captured", event);
    }

    public void publishHandoffRequested(Conversation conv) {
        Map<String, Object> event = new java.util.HashMap<>();
        event.put("eventType",      "handoff.requested");
        event.put("tenantId",       conv.getTenantId().toString());
        event.put("botId",          conv.getBotId().toString());
        event.put("conversationId", conv.getId().toString());
        event.put("occurredAt",     Instant.now().toString());
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
