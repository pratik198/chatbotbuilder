package com.chatplatform.core.entity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "bot_actions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BotAction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "bot_id", nullable = false)
    private UUID botId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type;   // webhook | email | slack

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private Map<String, Object> config = new HashMap<>();

    @Column(name = "trigger_on", nullable = false)
    @Builder.Default
    private String triggerOn = "lead_captured";  // lead_captured | conversation_ended | handoff_requested

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
