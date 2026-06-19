package com.chatplatform.core.dto.kb;

import com.chatplatform.core.entity.KnowledgeBase;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class KbDto {

    private UUID id;
    private UUID tenantId;
    private String name;
    private String description;
    private String status;
    private String embeddingModel;
    private Integer chunkSize;
    private Integer chunkOverlap;
    private Integer docCount;
    private Integer vectorCount;
    private Instant createdAt;
    private Instant updatedAt;

    public static KbDto from(KnowledgeBase kb) {
        KbDto dto = new KbDto();
        dto.id             = kb.getId();
        dto.tenantId       = kb.getTenantId();
        dto.name           = kb.getName();
        dto.description    = kb.getDescription();
        dto.status         = kb.getStatus();
        dto.embeddingModel = kb.getEmbeddingModel();
        dto.chunkSize      = kb.getChunkSize();
        dto.chunkOverlap   = kb.getChunkOverlap();
        dto.docCount       = kb.getDocCount();
        dto.vectorCount    = kb.getVectorCount();
        dto.createdAt      = kb.getCreatedAt();
        dto.updatedAt      = kb.getUpdatedAt();
        return dto;
    }
}
