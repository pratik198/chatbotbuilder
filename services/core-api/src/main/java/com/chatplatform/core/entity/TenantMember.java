package com.chatplatform.core.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Links a User to a Tenant with a specific role.
 * A user can be a member of multiple tenants with different roles.
 */
@Entity
@Table(
    name = "tenant_members",
    uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class TenantMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    // Role within this tenant
    @Column(nullable = false)
    @Builder.Default
    private String role = "member";  // owner | admin | member | analyst | agent

    @Column(name = "invited_by")
    private UUID invitedBy;

    @Column(nullable = false)
    @Builder.Default
    private String status = "active";  // active | invited | suspended

    @Column(name = "joined_at")
    private Instant joinedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
