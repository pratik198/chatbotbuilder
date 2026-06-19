package com.chatplatform.kb.service;

import com.chatplatform.kb.dto.ProcessDocumentEvent;
import com.chatplatform.kb.entity.Document;
import com.chatplatform.kb.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Core ingestion pipeline: extract text → chunk → embed → store in Qdrant.
 * Called by the RabbitMQ consumer.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentProcessorService {

    private final DocumentRepository documentRepo;
    private final TextExtractorService textExtractor;
    private final ChunkerService chunker;
    private final VectorStoreService vectorStore;

    /**
     * Full ingestion pipeline for a document.
     * Updates document status at each step so the UI can show progress.
     */
    @Transactional
    public void process(ProcessDocumentEvent event) {
        Document doc = documentRepo.findById(event.getDocumentId()).orElse(null);
        if (doc == null) {
            log.warn("Document not found: {}", event.getDocumentId());
            return;
        }

        log.info("Processing document {} (type={}) for tenant {}",
                 doc.getId(), doc.getSourceType(), doc.getTenantId());

        try {
            // Step 1: Update status to processing
            doc.setStatus("processing");
            documentRepo.save(doc);

            // Step 2: Extract text
            String text = textExtractor.extract(
                    event.getSourceType(),
                    event.getSourceUrl(),
                    event.getRawText()
            );

            if (text == null || text.isBlank()) {
                fail(doc, "No text could be extracted from the source");
                return;
            }

            // Step 3: Split into chunks
            List<String> chunks = chunker.chunk(text);
            if (chunks.isEmpty()) {
                fail(doc, "No chunks generated — document may be empty");
                return;
            }

            log.info("Document {} split into {} chunks", doc.getId(), chunks.size());

            // Step 4: Embed and upsert into Qdrant
            int stored = vectorStore.upsertChunks(
                    doc.getTenantId(),
                    doc.getKnowledgeBaseId(),
                    doc.getId(),
                    event.getSourceUrl(),
                    chunks
            );

            // Step 5: Mark as indexed
            doc.setStatus("indexed");
            doc.setChunkCount(stored);
            doc.setErrorMessage(null);
            documentRepo.save(doc);

            log.info("Document {} successfully indexed ({} chunks)", doc.getId(), stored);

        } catch (Exception e) {
            log.error("Failed to process document {}: {}", doc.getId(), e.getMessage(), e);
            fail(doc, e.getMessage());
        }
    }

    /**
     * Re-process all failed documents for a tenant (manual retry from UI).
     */
    public int retryFailed(java.util.UUID tenantId) {
        List<Document> failed = documentRepo.findByTenantIdAndStatus(tenantId, "failed");
        for (Document doc : failed) {
            ProcessDocumentEvent event = new ProcessDocumentEvent();
            event.setDocumentId(doc.getId());
            event.setKnowledgeBaseId(doc.getKnowledgeBaseId());
            event.setTenantId(doc.getTenantId());
            event.setSourceType(doc.getSourceType());
            event.setSourceUrl(doc.getSourceUrl());
            process(event);
        }
        return failed.size();
    }

    private void fail(Document doc, String message) {
        doc.setStatus("failed");
        doc.setErrorMessage(message != null && message.length() > 1000
                ? message.substring(0, 1000) : message);
        documentRepo.save(doc);
    }
}
