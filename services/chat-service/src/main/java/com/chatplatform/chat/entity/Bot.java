package com.chatplatform.chat.entity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.Type;

import java.util.Map;
import java.util.UUID;

/**
 * Read-only view of the bots table (owned by core-api).
 * Chat-service only reads bot config — never writes to this table.
 */
@Entity
@Table(name = "bots")
@Getter
public class Bot {

    @Id
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    private String name;
    private String status;

    @Column(name = "model_provider")
    private String modelProvider;

    @Column(name = "model_name")
    private String modelName;

    private Double temperature;

    @Column(name = "max_tokens")
    private Integer maxTokens;

    @Column(name = "system_prompt")
    private String systemPrompt;

    private String tone;
    private String language;

    @Column(name = "rag_enabled")
    private boolean ragEnabled;

    @Column(name = "lead_capture_enabled")
    private boolean leadCaptureEnabled;

    @Column(name = "live_chat_enabled")
    private boolean liveChatEnabled;

    @Type(JsonBinaryType.class)
    @Column(name = "widget_config", columnDefinition = "jsonb")
    private Map<String, Object> widgetConfig;

    @Column(name = "embed_token")
    private String embedToken;
}
