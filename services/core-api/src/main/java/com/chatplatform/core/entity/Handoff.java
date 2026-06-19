package com.chatplatform.core.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "handoffs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Handoff {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Column(name = "requested_by", nullable = false)
    @Builder.Default
    private String requestedBy = "visitor";

    @Column(name = "assigned_to")
    private UUID assignedTo;

    @Column(nullable = false)
    @Builder.Default
    private String status = "queued";   // queued | assigned | resolved | abandoned

    @Builder.Default
    private int priority = 0;

    private String notes;

    @Column(name = "queued_at", updatable = false)
    @Builder.Default
    private Instant queuedAt = Instant.now();

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
