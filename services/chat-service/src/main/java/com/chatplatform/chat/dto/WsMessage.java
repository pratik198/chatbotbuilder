package com.chatplatform.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * All WebSocket frames are JSON with this shape.
 *
 * Incoming from visitor/agent:
 *   { "type": "message",  "content": "Hello" }
 *   { "type": "handoff_request" }
 *   { "type": "feedback", "rating": 5 }
 *   { "type": "typing" }
 *
 * Outgoing to visitor:
 *   { "type": "message",       "role": "assistant", "content": "Hi!" }
 *   { "type": "stream_start" }
 *   { "type": "stream_token",  "delta": "Hi" }
 *   { "type": "stream_end",    "content": "Hi there!" }
 *   { "type": "handoff_queued" }
 *   { "type": "error",         "message": "..." }
 *
 * Outgoing to agent (inbox):
 *   { "type": "new_handoff",   "conversationId": "..." }
 *   { "type": "visitor_message", ... }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WsMessage {

    private String type;
    private String content;
    private String role;
    private String delta;       // streaming token
    private String message;     // error message or info text
    private Integer rating;
    private String conversationId;
    private Object data;        // generic payload for complex messages

    // Convenience factory methods
    public static WsMessage text(String role, String content) {
        WsMessage m = new WsMessage();
        m.type = "message";
        m.role = role;
        m.content = content;
        return m;
    }

    public static WsMessage streamToken(String delta) {
        WsMessage m = new WsMessage();
        m.type = "stream_token";
        m.delta = delta;
        return m;
    }

    public static WsMessage streamEnd(String fullContent) {
        WsMessage m = new WsMessage();
        m.type = "stream_end";
        m.content = fullContent;
        return m;
    }

    public static WsMessage error(String message) {
        WsMessage m = new WsMessage();
        m.type = "error";
        m.message = message;
        return m;
    }

    public static WsMessage of(String type, Object data) {
        WsMessage m = new WsMessage();
        m.type = type;
        m.data = data;
        return m;
    }
}
