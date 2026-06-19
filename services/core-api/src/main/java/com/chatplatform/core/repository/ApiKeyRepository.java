package com.chatplatform.core.repository;

import com.chatplatform.core.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID> {
    List<ApiKey> findByTenantId(UUID tenantId);
    Optional<ApiKey> findByKeyHash(String keyHash);
    Optional<ApiKey> findByIdAndTenantId(UUID id, UUID tenantId);
}
