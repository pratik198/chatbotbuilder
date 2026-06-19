package com.chatplatform.core.entity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Tenant = one organization / workspace.
 * Does NOT extend BaseEntity because Tenant itself IS the root — no tenantId FK.
 */
@Entity
@Table(name = "tenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 63)
    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private String plan = "free";

    @Column(nullable = false)
    @Builder.Default
    private String status = "active";   // active | suspended | deleted

    @Column(name = "owner_email", nullable = false)
    private String ownerEmail;

    @Column(name = "api_key", unique = true, nullable = false)
    private String apiKey;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> settings = new HashMap<>();

    // Default quotas — overridden per plan
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> quota = new HashMap<>(Map.of(
        "monthly_messages", 1000,
        "bots", 3,
        "team_members", 5
    ));

    // Current usage counters
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> usage = new HashMap<>(Map.of(
        "messages_used", 0,
        "bots_count", 0
    ));

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
