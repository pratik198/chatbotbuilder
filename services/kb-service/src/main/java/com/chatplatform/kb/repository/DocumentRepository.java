package com.chatplatform.kb.repository;

import com.chatplatform.kb.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByKnowledgeBaseIdOrderByCreatedAtDesc(UUID kbId);

    List<Document> findByTenantIdAndStatus(UUID tenantId, String status);

    Optional<Document> findByIdAndTenantId(UUID id, UUID tenantId);

    long countByKnowledgeBaseId(UUID kbId);
}
