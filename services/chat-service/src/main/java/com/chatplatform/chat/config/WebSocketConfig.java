package com.chatplatform.chat.config;

import com.chatplatform.chat.handler.AgentWebSocketHandler;
import com.chatplatform.chat.handler.ChatWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatHandler;
    private final AgentWebSocketHandler agentHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {

        // Public — visitors connect here using the embed token
        // e.g. ws://api.yourdomain.com/ws/chat/abc123embedtoken
        registry.addHandler(chatHandler, "/ws/chat/{embedToken}")
                .setAllowedOrigins("*");

        // Authenticated — agents connect here to handle live chat
        // e.g. ws://api.yourdomain.com/ws/inbox
        registry.addHandler(agentHandler, "/ws/inbox")
                .setAllowedOrigins("*");
    }
}
