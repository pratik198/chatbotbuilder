package com.chatplatform.chat.entity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * One conversation = one visitor session on a bot.
 * Created when a visitor sends their first message.
 */
@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "bot_id", nullable = false)
    private UUID botId;

    // Anonymous visitor identifier — set by the widget (stored in localStorage)
    @Column(name = "session_key", nullable = false)
    private String sessionKey;

    @Column(nullable = false)
    @Builder.Default
    private String channel = "web";   // web | whatsapp | telegram | api

    @Column(nullable = false)
    @Builder.Default
    private String status = "active";  // active | ended | handed_off

    // Filled once lead is captured
    @Column(name = "contact_id")
    private UUID contactId;

    @Column(name = "visitor_ip")
    private String visitorIp;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "referrer_url")
    private String referrerUrl;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    @CreatedDate
    @Column(name = "started_at", updatable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @Column(name = "message_count")
    @Builder.Default
    private int messageCount = 0;
}
