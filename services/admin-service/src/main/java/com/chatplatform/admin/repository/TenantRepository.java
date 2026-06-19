package com.chatplatform.admin.repository;

import com.chatplatform.admin.entity.Tenant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    Page<Tenant> findByStatus(String status, Pageable pageable);

    @Query("""
        SELECT t FROM Tenant t
        WHERE (:search IS NULL OR :search = ''
               OR LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(t.slug) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(t.ownerEmail) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:status IS NULL OR :status = '' OR t.status = :status)
        AND (:plan IS NULL OR :plan = '' OR t.plan = :plan)
        """)
    Page<Tenant> search(
            @Param("search") String search,
            @Param("status") String status,
            @Param("plan") String plan,
            Pageable pageable);

    long countByStatus(String status);

    long countByPlan(String plan);
}
