package com.chatplatform.kb.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String KB_EXCHANGE       = "kb.events";
    public static final String KB_PROCESS_QUEUE  = "kb.document.process";

    @Bean
    public TopicExchange kbExchange() {
        return new TopicExchange(KB_EXCHANGE, true, false);
    }

    @Bean
    public Queue kbProcessQueue() {
        return QueueBuilder.durable(KB_PROCESS_QUEUE).build();
    }

    @Bean
    public Binding kbProcessBinding(Queue kbProcessQueue, TopicExchange kbExchange) {
        return BindingBuilder.bind(kbProcessQueue)
                             .to(kbExchange)
                             .with("kb.document.#");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter());
        factory.setConcurrentConsumers(2);
        factory.setMaxConcurrentConsumers(5);
        return factory;
    }
}
