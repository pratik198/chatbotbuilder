package com.chatplatform.chat.repository;

import com.chatplatform.chat.entity.AgentAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AgentAvailabilityRepository extends JpaRepository<AgentAvailability, UUID> {
    List<AgentAvailability> findByTenantId(UUID tenantId);
    List<AgentAvailability> findByTenantIdAndStatus(UUID tenantId, String status);
}
