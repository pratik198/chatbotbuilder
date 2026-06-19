package com.chatplatform.core.dto.kb;

import com.chatplatform.core.entity.Document;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class DocumentDto {

    private UUID id;
    private UUID knowledgeBaseId;
    private String name;
    private String sourceType;
    private String sourceUrl;
    private String status;
    private Integer chunkCount;
    private String errorMessage;
    private Instant createdAt;

    public static DocumentDto from(Document doc) {
        return DocumentDto.builder()
                .id(doc.getId())
                .knowledgeBaseId(doc.getKnowledgeBaseId())
                .name(doc.getName())
                .sourceType(doc.getSourceType())
                .sourceUrl(doc.getSourceUrl())
                .status(doc.getStatus())
                .chunkCount(doc.getChunkCount())
                .errorMessage(doc.getErrorMessage())
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
