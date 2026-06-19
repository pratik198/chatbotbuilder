package com.chatplatform.core.repository;

import com.chatplatform.core.entity.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContactRepository extends JpaRepository<Contact, UUID> {

    Page<Contact> findByTenantId(UUID tenantId, Pageable pageable);

    Optional<Contact> findByIdAndTenantId(UUID id, UUID tenantId);

    Optional<Contact> findByTenantIdAndEmail(UUID tenantId, String email);

    Page<Contact> findByTenantIdAndStage(UUID tenantId, String stage, Pageable pageable);

    // Search by name or email
    @Query("""
        SELECT c FROM Contact c
        WHERE c.tenantId = :tenantId
        AND (
            LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(c.company) LIKE LOWER(CONCAT('%', :search, '%'))
        )
        """)
    Page<Contact> searchByTenantId(
        @Param("tenantId") UUID tenantId,
        @Param("search") String search,
        Pageable pageable
    );

    long countByTenantId(UUID tenantId);

    long countByTenantIdAndStage(UUID tenantId, String stage);
}
