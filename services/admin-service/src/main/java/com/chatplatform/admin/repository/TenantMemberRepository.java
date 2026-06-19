package com.chatplatform.admin.repository;

import com.chatplatform.admin.entity.TenantMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TenantMemberRepository extends JpaRepository<TenantMember, UUID> {

    List<TenantMember> findByTenantId(UUID tenantId);

    List<TenantMember> findByUserId(UUID userId);

    long countByTenantId(UUID tenantId);
}
