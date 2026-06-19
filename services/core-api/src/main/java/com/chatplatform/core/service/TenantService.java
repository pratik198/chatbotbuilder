package com.chatplatform.core.service;

import com.chatplatform.core.entity.Tenant;
import com.chatplatform.core.entity.TenantMember;
import com.chatplatform.core.entity.User;
import com.chatplatform.core.exception.BusinessException;
import com.chatplatform.core.exception.ResourceNotFoundException;
import com.chatplatform.core.repository.TenantMemberRepository;
import com.chatplatform.core.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepo;
    private final TenantMemberRepository memberRepo;

    /**
     * Creates a new tenant (workspace) and makes the user the owner.
     */
    @Transactional
    public Tenant createTenant(String name, String ownerEmail, User owner) {
        String slug = generateUniqueSlug(name);

        Tenant tenant = Tenant.builder()
                .name(name)
                .slug(slug)
                .ownerEmail(ownerEmail)
                .apiKey(UUID.randomUUID().toString().replace("-", ""))
                .build();

        tenant = tenantRepo.save(tenant);

        // Make the creating user the owner
        TenantMember member = TenantMember.builder()
                .tenantId(tenant.getId())
                .userId(owner.getId())
                .role("owner")
                .status("active")
                .joinedAt(Instant.now())
                .build();
        memberRepo.save(member);

        log.info("Created tenant '{}' (id={}) for {}", name, tenant.getId(), ownerEmail);
        return tenant;
    }

    public Tenant getTenantOrThrow(UUID tenantId) {
        return tenantRepo.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));
    }

    public Tenant getBySlug(String slug) {
        return tenantRepo.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant with slug not found: " + slug));
    }

    @Transactional
    public Tenant updateSettings(UUID tenantId, String name) {
        Tenant tenant = getTenantOrThrow(tenantId);
        if (name != null && !name.isBlank()) {
            tenant.setName(name);
        }
        return tenantRepo.save(tenant);
    }

    public List<TenantMember> getMembers(UUID tenantId) {
        return memberRepo.findByTenantId(tenantId);
    }

    /**
     * Check if a user is a member of a tenant and return their role.
     */
    public TenantMember getMemberOrThrow(UUID tenantId, UUID userId) {
        return memberRepo.findByTenantIdAndUserId(tenantId, userId)
                .orElseThrow(() -> new BusinessException("NOT_A_MEMBER",
                        "User is not a member of this workspace"));
    }

    // ── Private helpers ──────────────────────────────────────────

    private String generateUniqueSlug(String name) {
        // "My Awesome Bot Company!" → "my-awesome-bot-company"
        String base = Normalizer.normalize(name.toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");

        if (base.length() > 50) base = base.substring(0, 50);

        String slug = base;
        int counter = 1;
        while (tenantRepo.existsBySlug(slug)) {
            slug = base + "-" + counter++;
        }
        return slug;
    }
}
