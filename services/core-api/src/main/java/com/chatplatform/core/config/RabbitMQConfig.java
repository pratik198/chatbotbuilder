package com.chatplatform.core.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Exchange names
    public static final String CHAT_EXCHANGE     = "chat.events";
    public static final String KB_EXCHANGE       = "kb.events";
    public static final String ANALYTICS_EXCHANGE = "analytics.events";

    // Queue names
    public static final String KB_PROCESS_QUEUE    = "kb.document.process";
    public static final String ANALYTICS_QUEUE     = "analytics.ingest";
    public static final String WEBHOOK_QUEUE       = "webhook.deliver";

    // ── Exchanges ──────────────────────────────────────────────────

    @Bean
    public TopicExchange chatExchange() {
        return new TopicExchange(CHAT_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange kbExchange() {
        return new TopicExchange(KB_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange analyticsExchange() {
        return new TopicExchange(ANALYTICS_EXCHANGE, true, false);
    }

    // ── Queues ─────────────────────────────────────────────────────

    @Bean
    public Queue kbProcessQueue() {
        return QueueBuilder.durable(KB_PROCESS_QUEUE).build();
    }

    @Bean
    public Queue analyticsQueue() {
        return QueueBuilder.durable(ANALYTICS_QUEUE).build();
    }

    @Bean
    public Queue webhookQueue() {
        return QueueBuilder.durable(WEBHOOK_QUEUE).build();
    }

    // ── Bindings ───────────────────────────────────────────────────

    @Bean
    public Binding kbProcessBinding() {
        return BindingBuilder.bind(kbProcessQueue())
                .to(kbExchange())
                .with("kb.document.#");
    }

    @Bean
    public Binding analyticsBinding() {
        return BindingBuilder.bind(analyticsQueue())
                .to(analyticsExchange())
                .with("#");
    }

    @Bean
    public Binding webhookBinding() {
        return BindingBuilder.bind(webhookQueue())
                .to(chatExchange())
                .with("webhook.#");
    }

    // ── Serialization (JSON messages) ─────────────────────────────

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
