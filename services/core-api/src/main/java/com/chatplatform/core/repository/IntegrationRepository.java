package com.chatplatform.core.repository;

import com.chatplatform.core.entity.Integration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IntegrationRepository extends JpaRepository<Integration, UUID> {
    List<Integration> findByTenantId(UUID tenantId);
    Optional<Integration> findByTenantIdAndType(UUID tenantId, String type);
    boolean existsByTenantIdAndType(UUID tenantId, String type);
}
