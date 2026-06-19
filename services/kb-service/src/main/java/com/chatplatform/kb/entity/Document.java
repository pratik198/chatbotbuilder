package com.chatplatform.kb.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "knowledge_base_id", nullable = false)
    private UUID knowledgeBaseId;

    @Column(nullable = false)
    private String name;

    @Column(name = "source_type", nullable = false)
    private String sourceType;    // "pdf" | "url" | "docx" | "text"

    @Column(name = "source_url")
    private String sourceUrl;     // original URL or MinIO path

    @Column(nullable = false)
    private String status;        // "pending" | "processing" | "indexed" | "failed"

    @Column(name = "chunk_count")
    private Integer chunkCount;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;
}
