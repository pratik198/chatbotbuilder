package com.chatplatform.core.entity;

import com.chatplatform.core.context.TenantContext;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * All tenant-scoped entities extend this.
 * Automatically sets tenantId and timestamps.
 */
@Getter
@Setter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    // Auto-fill tenantId from TenantContext before saving
    @PrePersist
    protected void prePersist() {
        if (this.tenantId == null) {
            UUID tid = TenantContext.getTenantId();
            if (tid == null) {
                throw new IllegalStateException("No tenant in context — cannot persist entity");
            }
            this.tenantId = tid;
        }
    }
}
