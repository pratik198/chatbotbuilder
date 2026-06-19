package com.chatplatform.kb.controller;

import com.chatplatform.kb.entity.Document;
import com.chatplatform.kb.repository.DocumentRepository;
import com.chatplatform.kb.service.DocumentProcessorService;
import com.chatplatform.kb.service.VectorStoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Internal REST API used by core-api to query document status and trigger retries.
 * Not exposed publicly — behind nginx /internal/ prefix in production.
 */
@RestController
@RequestMapping("/kb")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentRepository docRepo;
    private final DocumentProcessorService processorService;
    private final VectorStoreService vectorStore;

    /**
     * GET /kb/knowledge-bases/{kbId}/documents
     * List all documents in a KB with their indexing status.
     */
    @GetMapping("/knowledge-bases/{kbId}/documents")
    public ResponseEntity<List<Document>> listDocuments(@PathVariable UUID kbId) {
        return ResponseEntity.ok(
            docRepo.findByKnowledgeBaseIdOrderByCreatedAtDesc(kbId)
        );
    }

    /**
     * GET /kb/documents/{id}/status
     * Poll indexing status for a specific document.
     */
    @GetMapping("/documents/{id}/status")
    public ResponseEntity<Map<String, Object>> getStatus(
            @PathVariable UUID id,
            @RequestParam UUID tenantId) {
        return docRepo.findByIdAndTenantId(id, tenantId)
                .map(doc -> ResponseEntity.ok(Map.<String, Object>of(
                    "id",         doc.getId(),
                    "status",     doc.getStatus(),
                    "chunkCount", doc.getChunkCount() != null ? doc.getChunkCount() : 0,
                    "error",      doc.getErrorMessage() != null ? doc.getErrorMessage() : ""
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /kb/documents/{id}
     * Remove a document and its vectors from Qdrant.
     */
    @DeleteMapping("/documents/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable UUID id,
            @RequestParam UUID tenantId) {
        return docRepo.findByIdAndTenantId(id, tenantId)
                .map(doc -> {
                    vectorStore.deleteByDocId(tenantId, id);
                    docRepo.delete(doc);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.<Void>notFound().build());
    }

    /**
     * POST /kb/retry?tenantId=uuid
     * Retry all failed documents for a tenant.
     */
    @PostMapping("/retry")
    public ResponseEntity<Map<String, Integer>> retryFailed(@RequestParam UUID tenantId) {
        int count = processorService.retryFailed(tenantId);
        return ResponseEntity.ok(Map.of("retriggered", count));
    }
}
