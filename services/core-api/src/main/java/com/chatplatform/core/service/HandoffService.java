package com.chatplatform.core.service;

import com.chatplatform.core.entity.Handoff;
import com.chatplatform.core.exception.ResourceNotFoundException;
import com.chatplatform.core.repository.HandoffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HandoffService {

    private final HandoffRepository handoffRepo;

    public Page<Handoff> list(UUID tenantId, String status, Pageable pageable) {
        if (status != null && !status.isBlank()) {
            return handoffRepo.findByTenantIdAndStatusOrderByQueuedAtDesc(tenantId, status, pageable);
        }
        return handoffRepo.findByTenantIdOrderByQueuedAtDesc(tenantId, pageable);
    }

    public Handoff getById(UUID id) {
        return handoffRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Handoff", id));
    }

    @Transactional
    public Handoff assign(UUID handoffId, UUID agentId) {
        Handoff h = getById(handoffId);
        h.setAssignedTo(agentId);
        h.setStatus("assigned");
        h.setAssignedAt(Instant.now());
        return handoffRepo.save(h);
    }

    @Transactional
    public Handoff resolve(UUID handoffId, String notes) {
        Handoff h = getById(handoffId);
        h.setStatus("resolved");
        h.setResolvedAt(Instant.now());
        if (notes != null) h.setNotes(notes);
        return handoffRepo.save(h);
    }
}
