package com.chatplatform.chat.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Minimal view of the contacts table used by chat-service to create leads.
 * Core-api owns the full entity with CRM fields; chat-service only needs to insert.
 */
@Entity
@Table(name = "contacts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column
    private String email;

    @Column(name = "first_name")
    private String firstName;

    @Column
    @Builder.Default
    private String source = "chat";

    @Column
    @Builder.Default
    private String stage = "new";

    @Column
    @Builder.Default
    private Integer score = 0;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = updatedAt = Instant.now();
    }
}
