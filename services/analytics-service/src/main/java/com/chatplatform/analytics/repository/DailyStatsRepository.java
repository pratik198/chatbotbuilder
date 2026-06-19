package com.chatplatform.analytics.repository;

import com.chatplatform.analytics.entity.DailyStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyStatsRepository extends JpaRepository<DailyStats, UUID> {

    Optional<DailyStats> findByTenantIdAndBotIdAndStatDate(UUID tenantId, UUID botId, LocalDate date);

    // Last N days of stats for a specific bot
    @Query("""
           SELECT s FROM DailyStats s
           WHERE s.tenantId = :tenantId AND s.botId = :botId
             AND s.statDate >= :from AND s.statDate <= :to
           ORDER BY s.statDate ASC
           """)
    List<DailyStats> findByTenantAndBotInRange(
        @Param("tenantId") UUID tenantId,
        @Param("botId") UUID botId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    // Aggregate across all bots for a tenant
    @Query("""
           SELECT s FROM DailyStats s
           WHERE s.tenantId = :tenantId
             AND s.statDate >= :from AND s.statDate <= :to
           ORDER BY s.statDate ASC
           """)
    List<DailyStats> findByTenantInRange(
        @Param("tenantId") UUID tenantId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );
}
