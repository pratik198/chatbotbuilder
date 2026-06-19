package com.chatplatform.admin.repository;

import com.chatplatform.admin.entity.DailyStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DailyStatsRepository extends JpaRepository<DailyStats, UUID> {

    @Query("SELECT s FROM DailyStats s WHERE s.statDate BETWEEN :from AND :to")
    List<DailyStats> findPlatformStatsInRange(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("SELECT s FROM DailyStats s WHERE s.tenantId = :tenantId AND s.statDate BETWEEN :from AND :to")
    List<DailyStats> findByTenantInRange(
            @Param("tenantId") UUID tenantId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
