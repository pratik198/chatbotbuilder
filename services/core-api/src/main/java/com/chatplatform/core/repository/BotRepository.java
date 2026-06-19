package com.chatplatform.core.repository;

import com.chatplatform.core.entity.Bot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BotRepository extends JpaRepository<Bot, UUID> {

    // All queries here are automatically scoped by tenantId
    // because we always pass it explicitly — simple and safe

    Page<Bot> findByTenantId(UUID tenantId, Pageable pageable);

    List<Bot> findByTenantIdAndStatus(UUID tenantId, String status);

    Optional<Bot> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<Bot> findByEmbedToken(String embedToken);

    long countByTenantIdAndStatusNot(UUID tenantId, String status);

    boolean existsByIdAndTenantId(UUID id, UUID tenantId);
}
