package com.chatplatform.kb.dto;

import lombok.Data;

import java.util.UUID;

/**
 * RabbitMQ message received from core-api when a document is uploaded.
 * core-api publishes this to kb.events exchange with routing key kb.document.process
 */
@Data
public class ProcessDocumentEvent {
    private UUID documentId;
    private UUID knowledgeBaseId;
    private UUID tenantId;
    private String sourceType;   // "pdf" | "url" | "docx" | "text"
    private String sourceUrl;    // MinIO path (for files) or the URL to scrape
    private String rawText;      // used when sourceType="text" (paste from UI)
}
