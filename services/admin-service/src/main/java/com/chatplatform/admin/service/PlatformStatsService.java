package com.chatplatform.admin.service;

import com.chatplatform.admin.dto.PlatformStatsDto;
import com.chatplatform.admin.entity.DailyStats;
import com.chatplatform.admin.repository.DailyStatsRepository;
import com.chatplatform.admin.repository.TenantRepository;
import com.chatplatform.admin.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlatformStatsService {

    private final TenantRepository tenantRepo;
    private final UserRepository userRepo;
    private final DailyStatsRepository statsRepo;

    public PlatformStatsDto getPlatformStats() {
        LocalDate to   = LocalDate.now();
        LocalDate from = to.minusDays(29);

        List<DailyStats> recent = statsRepo.findPlatformStatsInRange(from, to);

        long convs      = recent.stream().mapToLong(DailyStats::getConversationsStarted).sum();
        long msgs       = recent.stream().mapToLong(s -> s.getMessagesUser() + s.getMessagesAssistant()).sum();
        long leads      = recent.stream().mapToLong(DailyStats::getLeadsCaptured).sum();
        long handoffs   = recent.stream().mapToLong(DailyStats::getHandoffsRequested).sum();
        long promptTok  = recent.stream().mapToLong(DailyStats::getTotalPromptTokens).sum();
        long compTok    = recent.stream().mapToLong(DailyStats::getTotalCompletionTokens).sum();

        return PlatformStatsDto.builder()
                .totalTenants(tenantRepo.count())
                .activeTenants(tenantRepo.countByStatus("active"))
                .suspendedTenants(tenantRepo.countByStatus("suspended"))
                .totalUsers(userRepo.count())
                .activeUsers(userRepo.countByStatus("active"))
                .freePlanTenants(tenantRepo.countByPlan("free"))
                .starterPlanTenants(tenantRepo.countByPlan("starter"))
                .proPlanTenants(tenantRepo.countByPlan("pro"))
                .enterprisePlanTenants(tenantRepo.countByPlan("enterprise"))
                .conversationsLast30d(convs)
                .messagesLast30d(msgs)
                .leadsLast30d(leads)
                .handoffsLast30d(handoffs)
                .promptTokensLast30d(promptTok)
                .completionTokensLast30d(compTok)
                .build();
    }
}
