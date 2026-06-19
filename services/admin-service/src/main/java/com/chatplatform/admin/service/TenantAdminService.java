package com.chatplatform.admin.service;

import com.chatplatform.admin.dto.TenantDto;
import com.chatplatform.admin.dto.UpdateTenantRequest;
import com.chatplatform.admin.entity.Tenant;
import com.chatplatform.admin.repository.TenantMemberRepository;
import com.chatplatform.admin.repository.TenantRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantAdminService {

    private final TenantRepository tenantRepo;
    private final TenantMemberRepository memberRepo;

    public Page<TenantDto> listTenants(String search, String status, String plan, Pageable pageable) {
        Page<Tenant> tenants = tenantRepo.search(search, status, plan, pageable);
        return tenants.map(t -> TenantDto.from(t, memberRepo.countByTenantId(t.getId())));
    }

    public TenantDto getTenant(UUID id) {
        Tenant t = tenantRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found: " + id));
        long members = memberRepo.countByTenantId(id);
        return TenantDto.from(t, members);
    }

    @Transactional
    public TenantDto updateTenant(UUID id, UpdateTenantRequest req) {
        Tenant t = tenantRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found: " + id));

        if (req.getStatus() != null) {
            t.setStatus(req.getStatus());
            log.info("Admin set tenant {} status to {}", id, req.getStatus());
        }
        if (req.getPlan() != null) {
            t.setPlan(req.getPlan());
            log.info("Admin set tenant {} plan to {}", id, req.getPlan());
        }

        tenantRepo.save(t);
        return TenantDto.from(t, memberRepo.countByTenantId(id));
    }

    @Transactional
    public void suspendTenant(UUID id) {
        Tenant t = tenantRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found: " + id));
        t.setStatus("suspended");
        tenantRepo.save(t);
        log.warn("Admin suspended tenant {}", id);
    }

    @Transactional
    public void deleteTenant(UUID id) {
        Tenant t = tenantRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found: " + id));
        t.setStatus("deleted");
        tenantRepo.save(t);
        log.warn("Admin soft-deleted tenant {}", id);
    }
}
