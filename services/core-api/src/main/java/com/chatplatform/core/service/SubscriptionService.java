package com.chatplatform.core.service;

import com.chatplatform.core.entity.Subscription;
import com.chatplatform.core.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepo;

    public Subscription getOrCreate(UUID tenantId) {
        return subscriptionRepo.findByTenantId(tenantId)
                .orElseGet(() -> subscriptionRepo.save(Subscription.builder()
                        .tenantId(tenantId)
                        .planId("free")
                        .currentPeriodStart(Instant.now())
                        .currentPeriodEnd(Instant.now().plus(30, ChronoUnit.DAYS))
                        .build()));
    }

    @Transactional
    public Subscription upgradePlan(UUID tenantId, String planId) {
        Subscription sub = getOrCreate(tenantId);
        sub.setPlanId(planId);
        sub.setStatus("active");
        sub.setCurrentPeriodStart(Instant.now());
        sub.setCurrentPeriodEnd(Instant.now().plus(30, ChronoUnit.DAYS));
        sub.setCancelAtPeriodEnd(false);
        sub.setUpdatedAt(Instant.now());
        return subscriptionRepo.save(sub);
    }

    @Transactional
    public Subscription cancel(UUID tenantId) {
        Subscription sub = getOrCreate(tenantId);
        sub.setCancelAtPeriodEnd(true);
        sub.setUpdatedAt(Instant.now());
        return subscriptionRepo.save(sub);
    }
}
