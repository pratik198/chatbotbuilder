package com.chatplatform.core.service;

import com.chatplatform.core.dto.kb.CreateKbRequest;
import com.chatplatform.core.entity.KnowledgeBase;
import com.chatplatform.core.exception.ResourceNotFoundException;
import com.chatplatform.core.repository.KnowledgeBaseRepository;
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
public class KnowledgeBaseService {

    private final KnowledgeBaseRepository kbRepo;

    public Page<KnowledgeBase> listKbs(UUID tenantId, Pageable pageable) {
        return kbRepo.findByTenantId(tenantId, pageable);
    }

    public KnowledgeBase getKbOrThrow(UUID kbId, UUID tenantId) {
        return kbRepo.findByIdAndTenantId(kbId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("KnowledgeBase", kbId));
    }

    @Transactional
    public KnowledgeBase createKb(CreateKbRequest req, UUID tenantId, UUID userId) {
        KnowledgeBase kb = KnowledgeBase.builder()
                .name(req.getName())
                .description(req.getDescription())
                .embeddingModel(req.getEmbeddingModel())
                .chunkSize(req.getChunkSize())
                .chunkOverlap(req.getChunkOverlap())
                .createdBy(userId)
                .build();

        return kbRepo.save(kb);
    }

    @Transactional
    public void deleteKb(UUID kbId, UUID tenantId) {
        KnowledgeBase kb = getKbOrThrow(kbId, tenantId);
        kbRepo.delete(kb);
        // kb-service will clean up Qdrant vectors when it receives the delete event
        log.info("Deleted knowledge base {} for tenant {}", kbId, tenantId);
    }
}
