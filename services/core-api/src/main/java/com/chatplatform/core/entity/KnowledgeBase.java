package com.chatplatform.core.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * A collection of documents that a bot can search for answers.
 * Documents are indexed as vectors in Qdrant by the kb-service.
 */
@Entity
@Table(name = "knowledge_bases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeBase extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    @Builder.Default
    private String status = "idle";   // idle | processing | ready | failed

    @Column(name = "embedding_model", nullable = false)
    @Builder.Default
    private String embeddingModel = "nomic-embed-text";

    @Column(name = "chunk_size", nullable = false)
    @Builder.Default
    private Integer chunkSize = 512;

    @Column(name = "chunk_overlap", nullable = false)
    @Builder.Default
    private Integer chunkOverlap = 50;

    @Column(name = "doc_count", nullable = false)
    @Builder.Default
    private Integer docCount = 0;

    @Column(name = "vector_count", nullable = false)
    @Builder.Default
    private Integer vectorCount = 0;

    @Column(name = "created_by")
    private UUID createdBy;
}
