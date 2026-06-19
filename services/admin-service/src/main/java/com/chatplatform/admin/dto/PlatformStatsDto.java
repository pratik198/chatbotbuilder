package com.chatplatform.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlatformStatsDto {

    // Tenant counts
    private long totalTenants;
    private long activeTenants;
    private long suspendedTenants;

    // User counts
    private long totalUsers;
    private long activeUsers;

    // Plan distribution
    private long freePlanTenants;
    private long starterPlanTenants;
    private long proPlanTenants;
    private long enterprisePlanTenants;

    // Usage (last 30 days)
    private long conversationsLast30d;
    private long messagesLast30d;
    private long leadsLast30d;
    private long handoffsLast30d;
    private long promptTokensLast30d;
    private long completionTokensLast30d;
}
