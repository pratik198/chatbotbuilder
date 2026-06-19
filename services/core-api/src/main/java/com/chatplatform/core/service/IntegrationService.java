package com.chatplatform.core.service;

import com.chatplatform.core.entity.Integration;
import com.chatplatform.core.exception.ResourceNotFoundException;
import com.chatplatform.core.repository.IntegrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IntegrationService {

    private final IntegrationRepository integrationRepo;

    public List<Integration> listByTenant(UUID tenantId) {
        return integrationRepo.findByTenantId(tenantId);
    }

    public Integration getById(UUID id) {
        return integrationRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Integration", id));
    }

    @Transactional
    public Integration create(UUID tenantId, String type, String name,
                              Map<String, Object> config, Map<String, Object> credentials) {
        return integrationRepo.save(Integration.builder()
                .tenantId(tenantId)
                .type(type)
                .name(name)
                .config(config != null ? config : Map.of())
                .credentials(credentials != null ? credentials : Map.of())
                .build());
    }

    @Transactional
    public Integration update(UUID id, String name, String status,
                              Map<String, Object> config, Map<String, Object> credentials) {
        Integration i = getById(id);
        if (name != null)        i.setName(name);
        if (status != null)      i.setStatus(status);
        if (config != null)      i.setConfig(config);
        if (credentials != null) i.setCredentials(credentials);
        i.setUpdatedAt(Instant.now());
        return integrationRepo.save(i);
    }

    @Transactional
    public void delete(UUID id) {
        if (!integrationRepo.existsById(id)) throw new ResourceNotFoundException("Integration", id);
        integrationRepo.deleteById(id);
    }
}
