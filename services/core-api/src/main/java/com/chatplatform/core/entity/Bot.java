package com.chatplatform.core.entity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * A chatbot definition. Each bot belongs to one tenant.
 * Extend BaseEntity to get tenantId + timestamps automatically.
 */
@Entity
@Table(name = "bots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bot extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(nullable = false)
    @Builder.Default
    private String status = "draft";   // draft | active | archived

    // ── AI Configuration ─────────────────────────────────────────

    @Column(name = "model_provider", nullable = false)
    @Builder.Default
    private String modelProvider = "ollama";   // ollama | vllm | openai-compat

    @Column(name = "model_name", nullable = false)
    @Builder.Default
    private String modelName = "deepseek-v3";

    @Column(nullable = false)
    @Builder.Default
    private Double temperature = 0.7;

    @Column(name = "max_tokens", nullable = false)
    @Builder.Default
    private Integer maxTokens = 2048;

    // The main instruction that shapes bot behavior
    @Column(name = "system_prompt", columnDefinition = "TEXT")
    private String systemPrompt;

    @Column(nullable = false)
    @Builder.Default
    private String tone = "professional";  // professional | friendly | casual

    @Column(nullable = false)
    @Builder.Default
    private String language = "en";

    // ── Feature Toggles ──────────────────────────────────────────

    @Column(name = "rag_enabled", nullable = false)
    @Builder.Default
    private boolean ragEnabled = false;

    @Column(name = "lead_capture_enabled", nullable = false)
    @Builder.Default
    private boolean leadCaptureEnabled = true;

    @Column(name = "live_chat_enabled", nullable = false)
    @Builder.Default
    private boolean liveChatEnabled = false;

    // ── Widget Appearance ─────────────────────────────────────────

    @Type(JsonBinaryType.class)
    @Column(name = "widget_config", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private Map<String, Object> widgetConfig = new HashMap<>(Map.of(
        "primary_color",    "#4F46E5",
        "position",         "bottom-right",
        "welcome_message",  "Hi! How can I help you today?"
    ));

    // Unique token used in embed script — customers put this in their website
    @Column(name = "embed_token", unique = true, nullable = false)
    @Builder.Default
    private String embedToken = UUID.randomUUID().toString().replace("-", "");

    @Column(name = "created_by")
    private UUID createdBy;
}
