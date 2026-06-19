package com.chatplatform.core.service;

import com.chatplatform.core.config.RabbitMQConfig;
import com.chatplatform.core.dto.kb.AddDocumentRequest;
import com.chatplatform.core.entity.Document;
import com.chatplatform.core.entity.KnowledgeBase;
import com.chatplatform.core.exception.BusinessException;
import com.chatplatform.core.exception.ResourceNotFoundException;
import com.chatplatform.core.repository.DocumentRepository;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository docRepo;
    private final KnowledgeBaseService kbService;
    private final MinioClient minioClient;
    private final RabbitTemplate rabbitTemplate;

    @Value("${app.minio.bucket}")
    private String bucket;

    /**
     * Add a URL or raw text document to a knowledge base.
     * Saves the document record and publishes a RabbitMQ event for kb-service to process.
     */
    @Transactional
    public Document addDocument(UUID kbId, UUID tenantId, AddDocumentRequest req) {
        KnowledgeBase kb = kbService.getKbOrThrow(kbId, tenantId);

        // Validate
        if ("url".equals(req.getSourceType()) && isBlank(req.getSourceUrl())) {
            throw new BusinessException("sourceUrl is required when sourceType is 'url'", HttpStatus.BAD_REQUEST);
        }
        if ("text".equals(req.getSourceType()) && isBlank(req.getRawText())) {
            throw new BusinessException("rawText is required when sourceType is 'text'", HttpStatus.BAD_REQUEST);
        }

        // Save document record
        Document doc = Document.builder()
                .knowledgeBaseId(kb.getId())
                .name(req.getName())
                .sourceType(req.getSourceType())
                .sourceUrl(req.getSourceUrl())
                .status("pending")
                .build();
        doc = docRepo.save(doc);

        // Publish event to kb-service
        publishProcessEvent(doc, tenantId, req.getRawText());

        log.info("Document {} queued for processing (type={})", doc.getId(), doc.getSourceType());
        return doc;
    }

    /**
     * Upload a file (PDF/DOCX) to MinIO and queue for processing.
     */
    @Transactional
    public Document uploadFile(UUID kbId, UUID tenantId, MultipartFile file) {
        KnowledgeBase kb = kbService.getKbOrThrow(kbId, tenantId);

        String ext = getExtension(file.getOriginalFilename());
        String sourceType = ext.equalsIgnoreCase("pdf") ? "pdf" : "docx";
        String objectPath = "tenants/" + tenantId + "/kb/" + kbId + "/" + UUID.randomUUID() + "." + ext;

        // Upload to MinIO
        try {
            ensureBucket();
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectPath)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
        } catch (Exception e) {
            log.error("MinIO upload failed: {}", e.getMessage());
            throw new BusinessException("File upload failed: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Save document record
        Document doc = Document.builder()
                .knowledgeBaseId(kb.getId())
                .name(file.getOriginalFilename())
                .sourceType(sourceType)
                .sourceUrl(objectPath)
                .fileSizeBytes(file.getSize())
                .status("pending")
                .build();
        doc = docRepo.save(doc);

        // Publish event to kb-service
        publishProcessEvent(doc, tenantId, null);

        log.info("File {} uploaded to MinIO and queued for processing", doc.getId());
        return doc;
    }

    public List<Document> listDocuments(UUID kbId, UUID tenantId) {
        kbService.getKbOrThrow(kbId, tenantId);
        return docRepo.findByKnowledgeBaseIdAndTenantIdOrderByCreatedAtDesc(kbId, tenantId);
    }

    public void deleteDocument(UUID docId, UUID tenantId) {
        Document doc = docRepo.findByIdAndTenantId(docId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", docId));
        docRepo.delete(doc);
        log.info("Document {} deleted", docId);
    }

    // ── Private ──────────────────────────────────────────────────

    private void publishProcessEvent(Document doc, UUID tenantId, String rawText) {
        Map<String, Object> event = new HashMap<>();
        event.put("documentId",      doc.getId());
        event.put("knowledgeBaseId", doc.getKnowledgeBaseId());
        event.put("tenantId",        tenantId);
        event.put("sourceType",      doc.getSourceType());
        event.put("sourceUrl",       doc.getSourceUrl());
        event.put("rawText",         rawText);

        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.KB_EXCHANGE, "kb.document.process", event);
        } catch (Exception e) {
            log.error("Failed to publish document process event: {}", e.getMessage());
            // Don't fail the request — document is saved, can be retried manually
        }
    }

    private void ensureBucket() throws Exception {
        boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!exists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "pdf";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
