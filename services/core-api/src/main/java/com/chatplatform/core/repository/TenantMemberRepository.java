package com.chatplatform.core.repository;

import com.chatplatform.core.entity.TenantMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantMemberRepository extends JpaRepository<TenantMember, UUID> {

    List<TenantMember> findByTenantId(UUID tenantId);

    Optional<TenantMember> findByTenantIdAndUserId(UUID tenantId, UUID userId);

    boolean existsByTenantIdAndUserId(UUID tenantId, UUID userId);

    // How many members does a tenant have
    long countByTenantIdAndStatus(UUID tenantId, String status);

    // All tenants a user belongs to
    List<TenantMember> findByUserId(UUID userId);
}
