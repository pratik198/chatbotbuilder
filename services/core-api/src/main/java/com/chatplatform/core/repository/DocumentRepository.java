package com.chatplatform.core.repository;

import com.chatplatform.core.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByKnowledgeBaseIdAndTenantIdOrderByCreatedAtDesc(UUID kbId, UUID tenantId);

    Optional<Document> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByKnowledgeBaseId(UUID kbId);
}
