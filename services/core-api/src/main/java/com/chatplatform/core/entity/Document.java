package com.chatplatform.core.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Represents a document inside a knowledge base.
 * Created by core-api when a user adds a URL or uploads a file.
 * kb-service picks it up via RabbitMQ and does the actual ingestion.
 */
@Entity
@Table(name = "documents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Document extends BaseEntity {

    @Column(name = "knowledge_base_id", nullable = false, updatable = false)
    private UUID knowledgeBaseId;

    @Column(nullable = false)
    private String name;

    @Column(name = "source_type", nullable = false)
    private String sourceType;    // "pdf" | "url" | "docx" | "text"

    @Column(name = "source_url")
    private String sourceUrl;

    @Column(nullable = false)
    @Builder.Default
    private String status = "pending";  // "pending" | "processing" | "indexed" | "failed"

    @Column(name = "chunk_count")
    private Integer chunkCount;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;
}
