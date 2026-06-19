package com.chatplatform.core.repository;

import com.chatplatform.core.entity.Handoff;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HandoffRepository extends JpaRepository<Handoff, UUID> {
    Page<Handoff> findByTenantIdOrderByQueuedAtDesc(UUID tenantId, Pageable pageable);
    Page<Handoff> findByTenantIdAndStatusOrderByQueuedAtDesc(UUID tenantId, String status, Pageable pageable);
    List<Handoff> findByTenantIdAndStatus(UUID tenantId, String status);
    Optional<Handoff> findByConversationId(UUID conversationId);
}
