package com.chatplatform.chat.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agent_availability")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AgentAvailability {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    @Builder.Default
    private String status = "offline";   // online | busy | offline

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
