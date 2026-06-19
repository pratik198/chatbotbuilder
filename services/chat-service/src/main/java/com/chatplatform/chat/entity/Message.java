package com.chatplatform.chat.entity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A single message in a conversation.
 * role = "user" (visitor) | "assistant" (AI) | "agent" (human agent)
 */
@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    // "user" | "assistant" | "agent" | "system"
    @Column(nullable = false)
    private String role;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "content_type")
    @Builder.Default
    private String contentType = "text";

    // AI usage stats (null for user messages)
    @Column(name = "model_used")
    private String modelUsed;

    @Column(name = "prompt_tokens")
    private Integer promptTokens;

    @Column(name = "completion_tokens")
    private Integer completionTokens;

    @Column(name = "latency_ms")
    private Integer latencyMs;

    // RAG source documents used to generate this response
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private List<Object> sources;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
