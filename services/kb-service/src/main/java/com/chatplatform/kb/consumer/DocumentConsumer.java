package com.chatplatform.kb.consumer;

import com.chatplatform.kb.config.RabbitMQConfig;
import com.chatplatform.kb.dto.ProcessDocumentEvent;
import com.chatplatform.kb.service.DocumentProcessorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Listens for document processing events from core-api.
 * When a user uploads a file or adds a URL, core-api saves the document record
 * and publishes this event. We pick it up and run the ingestion pipeline.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DocumentConsumer {

    private final DocumentProcessorService processor;

    @RabbitListener(queues = RabbitMQConfig.KB_PROCESS_QUEUE)
    public void handleProcessDocument(ProcessDocumentEvent event) {
        log.info("Received document processing event: docId={} type={}",
                 event.getDocumentId(), event.getSourceType());
        try {
            processor.process(event);
        } catch (Exception e) {
            // Log but don't rethrow — prevents RabbitMQ from infinite-requeuing
            // In production: route to a dead-letter queue
            log.error("Unhandled error processing document {}: {}",
                      event.getDocumentId(), e.getMessage(), e);
        }
    }
}
