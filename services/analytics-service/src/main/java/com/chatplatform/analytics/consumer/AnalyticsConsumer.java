package com.chatplatform.analytics.consumer;

import com.chatplatform.analytics.config.RabbitMQConfig;
import com.chatplatform.analytics.dto.AnalyticsEvent;
import com.chatplatform.analytics.service.StatsAggregatorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Listens for all events on the analytics.ingest queue.
 * Events are published by chat-service and core-api.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AnalyticsConsumer {

    private final StatsAggregatorService aggregator;

    @RabbitListener(queues = RabbitMQConfig.ANALYTICS_QUEUE)
    public void handle(AnalyticsEvent event) {
        try {
            log.debug("Analytics event received: type={} tenant={} bot={}",
                      event.getEventType(), event.getTenantId(), event.getBotId());
            aggregator.ingest(event);
        } catch (Exception e) {
            // Never rethrow — analytics must not affect the chat flow
            log.error("Failed to ingest analytics event {}: {}", event.getEventType(), e.getMessage());
        }
    }
}
