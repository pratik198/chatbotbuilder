package com.chatplatform.core.repository;

import com.chatplatform.core.entity.WebhookDelivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface WebhookDeliveryRepository extends JpaRepository<WebhookDelivery, UUID> {
    Page<WebhookDelivery> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);
    Page<WebhookDelivery> findByActionIdOrderByCreatedAtDesc(UUID actionId, Pageable pageable);
}
